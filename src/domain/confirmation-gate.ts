/**
 * ConfirmationGate — domínio (Fase 2.2)
 *
 * Create / update / reopen exigem confirmação do funcionário (**E**).
 * Este módulo avalia elegibilidade de forma pura (sem Prisma/IO).
 * O serviço DEVE:
 * 1) consumir o token com UPDATE condicional na mesma tx da mutação;
 * 2) revalidar authz no servidor (este gate não substitui authz de aplicação).
 *
 * TTL default 30 min = **Hipótese (H)** — não é requisito do PRD.
 * Ver data-model.md §3.8 e architecture.md §ConfirmationGate.
 */

import { isAgentPaused } from './conversation-status';
import { ConfirmationInvalidError, type ConfirmationInvalidReason } from './errors';
import { canReopen } from './reopen';
import type { ConversationStatus, PendingOperation, TicketStatus } from './types';
import { OPEN_TICKET_STATUSES } from './types';

/**
 * HIPÓTESE (H): TTL do PendingConfirmation.
 * Valor default para demos/testes; sobrescreva via parâmetro/env no serviço.
 */
export const DEFAULT_PENDING_CONFIRMATION_TTL_MS = 30 * 60 * 1000;

export type PendingConfirmationSnapshot = {
  token: string;
  employeeId: string;
  conversationId: string;
  operation: PendingOperation;
  /** Draft opaco; ticketId obrigatório para UPDATE/REOPEN. */
  payload: { ticketId?: string; [key: string]: unknown };
  expiresAt: Date;
  consumedAt: Date | null;
};

export type ConversationSnapshot = {
  id: string;
  employeeId: string;
  status: ConversationStatus;
};

export type TicketSnapshot = {
  id: string;
  ownerEmployeeId: string;
  status: TicketStatus;
  resolvedAt: Date | null;
};

export type TokenConsumptionInput = {
  /** null quando o token não existe no banco. */
  pending: PendingConfirmationSnapshot | null;
  sessionEmployeeId: string;
  now: Date;
};

export type MutationAuthorizationInput = {
  pending: PendingConfirmationSnapshot;
  sessionEmployeeId: string;
  conversation: ConversationSnapshot;
  /** Obrigatório para UPDATE/REOPEN. */
  ticket?: TicketSnapshot | null;
  now: Date;
  /** HIPÓTESE: reopen de APPROVED — default false. */
  allowReopenFromApproved?: boolean;
};

export type GateOk = { ok: true };
export type GateFail = { ok: false; reason: ConfirmationInvalidReason };
export type GateResult = GateOk | GateFail;

export function computePendingExpiresAt(
  now: Date,
  ttlMs: number = DEFAULT_PENDING_CONFIRMATION_TTL_MS,
): Date {
  if (ttlMs <= 0) {
    throw new Error('PendingConfirmation TTL must be positive');
  }
  return new Date(now.getTime() + ttlMs);
}

/**
 * Espelha as condições do UPDATE condicional de consumo (data-model §3.8).
 * Não persiste — o serviço aplica o UPDATE … RETURNING.
 */
export function evaluateTokenConsumption(input: TokenConsumptionInput): GateResult {
  const { pending, sessionEmployeeId, now } = input;

  if (pending == null) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  if (pending.employeeId !== sessionEmployeeId) {
    return { ok: false, reason: 'WRONG_EMPLOYEE' };
  }
  if (pending.consumedAt != null) {
    return { ok: false, reason: 'ALREADY_CONSUMED' };
  }
  if (pending.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: 'EXPIRED' };
  }
  return { ok: true };
}

function isOpenTicketStatus(status: TicketStatus): boolean {
  return (OPEN_TICKET_STATUSES as readonly TicketStatus[]).includes(status);
}

/**
 * Revalida authz/contexto após o token ser elegível a consumo.
 * UPDATE/REOPEN exigem ticket do owner da sessão.
 */
export function evaluateConfirmationMutation(input: MutationAuthorizationInput): GateResult {
  const { pending, sessionEmployeeId, conversation, ticket, now } = input;

  if (pending.employeeId !== sessionEmployeeId) {
    return { ok: false, reason: 'WRONG_EMPLOYEE' };
  }
  if (conversation.employeeId !== sessionEmployeeId) {
    return { ok: false, reason: 'CONVERSATION_NOT_OWNED' };
  }
  if (pending.conversationId !== conversation.id) {
    return { ok: false, reason: 'CONVERSATION_MISMATCH' };
  }

  // Tipicamente confirmação do chat só com agent ativo (T).
  if (conversation.status === 'CLOSED') {
    return { ok: false, reason: 'CONVERSATION_CLOSED' };
  }
  if (isAgentPaused(conversation.status)) {
    return { ok: false, reason: 'AGENT_PAUSED' };
  }

  if (pending.operation === 'CREATE') {
    return { ok: true };
  }

  const ticketId = pending.payload.ticketId;
  if (typeof ticketId !== 'string' || ticketId.length === 0) {
    return { ok: false, reason: 'TICKET_REQUIRED' };
  }
  if (ticket == null || ticket.id !== ticketId) {
    return { ok: false, reason: 'TICKET_REQUIRED' };
  }
  if (ticket.ownerEmployeeId !== sessionEmployeeId) {
    return { ok: false, reason: 'TICKET_OWNER_MISMATCH' };
  }

  if (pending.operation === 'UPDATE') {
    if (!isOpenTicketStatus(ticket.status)) {
      return { ok: false, reason: 'OPERATION_NOT_ELIGIBLE' };
    }
    return { ok: true };
  }

  // REOPEN
  const reopen = canReopen({
    status: ticket.status,
    resolvedAt: ticket.resolvedAt,
    now,
    allowReopenFromApproved: input.allowReopenFromApproved,
  });
  if (!reopen.eligible) {
    return { ok: false, reason: 'REOPEN_NOT_ELIGIBLE' };
  }
  return { ok: true };
}

/**
 * Avaliação completa do gate (consumo + mutação).
 * Sucesso aqui autoriza o serviço a executar token consume + mutação na mesma tx.
 */
export function evaluateConfirmationGate(
  input: TokenConsumptionInput &
    Omit<MutationAuthorizationInput, 'pending'> & {
      pending: PendingConfirmationSnapshot | null;
      conversation: ConversationSnapshot;
    },
): GateResult {
  const consumption = evaluateTokenConsumption({
    pending: input.pending,
    sessionEmployeeId: input.sessionEmployeeId,
    now: input.now,
  });
  if (!consumption.ok) return consumption;

  return evaluateConfirmationMutation({
    pending: input.pending!,
    sessionEmployeeId: input.sessionEmployeeId,
    conversation: input.conversation,
    ticket: input.ticket,
    now: input.now,
    allowReopenFromApproved: input.allowReopenFromApproved,
  });
}

export function assertConfirmationGate(
  input: Parameters<typeof evaluateConfirmationGate>[0],
): void {
  const result = evaluateConfirmationGate(input);
  if (!result.ok) {
    throw new ConfirmationInvalidError(result.reason);
  }
}
