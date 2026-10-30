/**
 * TicketService — mutações de chamado somente via ConfirmationGate (E).
 * Isolado do agent; não importa React/Gemini.
 * Persistência via TicketStore (in-memory ou Prisma).
 */

import { computePendingExpiresAt, evaluateConfirmationGate } from '@/domain/confirmation-gate';
import {
  ConfirmationInvalidError,
  TicketAccessDeniedError,
  TicketNotFoundError,
} from '@/domain/errors';
import { computeSlaDeadline, shouldRecalculateSla } from '@/domain/sla';
import { normalizeTicketDraftFields } from '@/domain/ticket-draft-normalize';
import type { TicketType } from '@/domain/types';
import {
  createIntermittentFailurePolicy,
  type IntermittentFailurePolicy,
} from './intermittent-failure';
import type { TicketStore } from './ticket-store';
import type {
  ConfirmTicketMutationInput,
  ConfirmTicketMutationResult,
  PrepareTicketDraftInput,
  PrepareTicketDraftResult,
  TicketDraftPayload,
  TicketEventRecord,
  TicketRecord,
} from './types';

export type TicketServiceDeps = {
  store: TicketStore;
  failure?: IntermittentFailurePolicy;
  now?: () => Date;
  createId?: () => string;
  createToken?: () => string;
};

export type TicketService = {
  listMyTickets(ownerEmployeeId: string): Promise<TicketRecord[]>;
  getTicket(ticketId: string, ownerEmployeeId: string): Promise<TicketRecord>;
  prepareTicketDraft(input: PrepareTicketDraftInput): Promise<PrepareTicketDraftResult>;
  confirmTicketMutation(input: ConfirmTicketMutationInput): Promise<ConfirmTicketMutationResult>;
};

function defaultId(): string {
  return `id_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function defaultToken(): string {
  return `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function formatTicketNumber(type: TicketType, seq: number): string {
  return `${type}-${String(seq).padStart(4, '0')}`;
}

export function createTicketService(deps: TicketServiceDeps): TicketService {
  const store = deps.store;
  const failure = deps.failure ?? createIntermittentFailurePolicy({ failureRate: 0 });
  const nowFn = deps.now ?? (() => new Date());
  const createId = deps.createId ?? defaultId;
  const createToken = deps.createToken ?? defaultToken;

  return {
    async listMyTickets(ownerEmployeeId) {
      failure.maybeFail();
      return store.listTicketsByOwner(ownerEmployeeId);
    },

    async getTicket(ticketId, ownerEmployeeId) {
      failure.maybeFail();
      const ticket = await store.findTicketById(ticketId);
      if (!ticket) throw new TicketNotFoundError();
      if (ticket.ownerEmployeeId !== ownerEmployeeId) {
        throw new TicketAccessDeniedError();
      }
      return ticket;
    },

    async prepareTicketDraft(input) {
      failure.maybeFail();
      const now = nowFn();
      const conversation = await store.findConversationById(input.conversationId);
      if (!conversation || conversation.employeeId !== input.sessionEmployeeId) {
        throw new ConfirmationInvalidError('CONVERSATION_NOT_OWNED');
      }
      if (conversation.status !== 'WITH_AGENT') {
        throw new ConfirmationInvalidError(
          conversation.status === 'CLOSED' ? 'CONVERSATION_CLOSED' : 'AGENT_PAUSED',
        );
      }

      if (input.operation === 'UPDATE' || input.operation === 'REOPEN') {
        const ticketId = input.payload.ticketId;
        if (!ticketId) throw new ConfirmationInvalidError('TICKET_REQUIRED');
        const ticket = await store.findTicketById(ticketId);
        if (!ticket) throw new TicketNotFoundError();
        if (ticket.ownerEmployeeId !== input.sessionEmployeeId) {
          throw new TicketAccessDeniedError();
        }
      }

      const normalized = normalizeTicketDraftFields(input.payload);
      const payload: TicketDraftPayload = {
        ...input.payload,
        type: normalized.type,
        category: normalized.category,
        priority: normalized.priority,
      };

      const token = createToken();
      const expiresAt = computePendingExpiresAt(now, input.ttlMs);
      await store.createPending({
        id: createId(),
        token,
        employeeId: input.sessionEmployeeId,
        conversationId: input.conversationId,
        operation: input.operation,
        payload,
        expiresAt,
      });

      return { token, expiresAt, operation: input.operation };
    },

    async confirmTicketMutation(input) {
      failure.maybeFail();
      const now = nowFn();

      return store.runInTransaction(async (tx) => {
        const pendingBefore = await tx.findPendingByToken(input.token);
        if (pendingBefore == null) {
          throw new ConfirmationInvalidError('NOT_FOUND');
        }

        if (pendingBefore.conversationId !== input.expectedConversationId) {
          throw new ConfirmationInvalidError('CONVERSATION_MISMATCH');
        }

        const conversation = await tx.findConversationById(input.expectedConversationId);
        if (conversation == null) {
          throw new ConfirmationInvalidError('CONVERSATION_MISMATCH');
        }

        const ticketForGate =
          pendingBefore.payload.ticketId != null
            ? await tx.findTicketById(pendingBefore.payload.ticketId)
            : null;

        const gate = evaluateConfirmationGate({
          pending: {
            token: pendingBefore.token,
            employeeId: pendingBefore.employeeId,
            conversationId: pendingBefore.conversationId,
            operation: pendingBefore.operation,
            payload: pendingBefore.payload as { ticketId?: string; [key: string]: unknown },
            expiresAt: pendingBefore.expiresAt,
            consumedAt: pendingBefore.consumedAt,
          },
          sessionEmployeeId: input.sessionEmployeeId,
          conversation,
          ticket: ticketForGate,
          now,
        });

        if (!gate.ok) {
          throw new ConfirmationInvalidError(gate.reason);
        }

        const consumed = await tx.consumePending({
          token: input.token,
          sessionEmployeeId: input.sessionEmployeeId,
          now,
        });
        if (!consumed) {
          // Race: outro request consumiu entre evaluate e consume
          throw new ConfirmationInvalidError('ALREADY_CONSUMED');
        }

        const normalized = normalizeTicketDraftFields(consumed.payload);
        const payload: TicketDraftPayload = {
          ...consumed.payload,
          type: normalized.type,
          category: normalized.category,
          priority: normalized.priority,
        };
        const actorId = input.sessionEmployeeId;

        if (consumed.operation === 'CREATE') {
          return applyCreate(tx, payload, actorId, now, createId);
        }
        if (consumed.operation === 'UPDATE') {
          return applyUpdate(tx, payload, actorId, now, createId);
        }
        return applyReopen(tx, payload, actorId, now, createId);
      });
    },
  };
}

async function applyCreate(
  tx: TicketStore,
  payload: TicketDraftPayload,
  actorId: string,
  now: Date,
  createId: () => string,
): Promise<ConfirmTicketMutationResult> {
  const seq = (await tx.countTicketsByType(payload.type)) + 1;
  const ticket = await tx.createTicket({
    id: createId(),
    number: formatTicketNumber(payload.type, seq),
    type: payload.type,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    status: 'OPEN',
    ownerEmployeeId: actorId,
    affectedEmployeeId: payload.affectedEmployeeId,
    slaDeadlineAt: computeSlaDeadline(payload.priority, now),
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const event = await tx.createEvent({
    id: createId(),
    ticketId: ticket.id,
    kind: 'CREATED',
    summary: `Chamado ${ticket.number} criado`,
    actorType: 'EMPLOYEE',
    actorId,
    createdAt: now,
  });

  return { ticket, event };
}

async function applyUpdate(
  tx: TicketStore,
  payload: TicketDraftPayload,
  actorId: string,
  now: Date,
  createId: () => string,
): Promise<ConfirmTicketMutationResult> {
  const ticketId = payload.ticketId!;
  const current = await tx.findTicketById(ticketId);
  if (!current) throw new TicketNotFoundError();

  const priorityChanged = current.priority !== payload.priority;
  const recalc =
    shouldRecalculateSla('COMPLEMENT_UPDATE') ||
    (priorityChanged && shouldRecalculateSla('PRIORITY_CHANGE'));

  const ticket = await tx.updateTicket(ticketId, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    slaDeadlineAt: recalc ? computeSlaDeadline(payload.priority, now) : current.slaDeadlineAt,
    updatedAt: now,
  });

  const event = await tx.createEvent({
    id: createId(),
    ticketId: ticket.id,
    kind: priorityChanged ? 'PRIORITY_CHANGED' : 'UPDATED',
    summary: priorityChanged
      ? `Prioridade ${current.priority} → ${payload.priority}`
      : `Chamado ${ticket.number} atualizado`,
    actorType: 'EMPLOYEE',
    actorId,
    createdAt: now,
  });

  return { ticket, event };
}

async function applyReopen(
  tx: TicketStore,
  payload: TicketDraftPayload,
  actorId: string,
  now: Date,
  createId: () => string,
): Promise<ConfirmTicketMutationResult> {
  const ticketId = payload.ticketId!;
  const current = await tx.findTicketById(ticketId);
  if (!current) throw new TicketNotFoundError();

  // REOPEN recalcula SLA (T); resolvedAt = null (E/T)
  const ticket = await tx.updateTicket(ticketId, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    status: 'OPEN',
    resolvedAt: null,
    slaDeadlineAt: computeSlaDeadline(payload.priority, now),
    updatedAt: now,
  });

  const event: TicketEventRecord = await tx.createEvent({
    id: createId(),
    ticketId: ticket.id,
    kind: 'REOPENED',
    summary: `Chamado ${ticket.number} reaberto`,
    actorType: 'EMPLOYEE',
    actorId,
    createdAt: now,
  });

  return { ticket, event };
}
