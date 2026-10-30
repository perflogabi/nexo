/**
 * ConversationService — ownership, mensagens e limite 30 no servidor.
 * Agent Mastra/Gemini orquestra em `src/agent`; aqui persistência + regras.
 */

import { isAgentPaused } from '@/domain/conversation-status';
import {
  AgentPausedError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  MessageLimitExceededError,
} from '@/domain/errors';
import {
  canAcceptCountableMessage,
  countsTowardMessageLimit,
  MESSAGE_LIMIT_PER_CONVERSATION,
} from '@/domain/message-limit';
import { canTransitionConversation, transferTransitionRequirements } from '@/domain/transfer';
import { normalizeTransferReasonCode } from '@/domain/transfer-reason-normalize';
import type { TransferReasonCode } from '@/domain/types';
import type { ConversationStore } from './conversation-store';
import type {
  AppendMessageInput,
  ConversationRecord,
  DecisionTraceRecord,
  MessageRecord,
} from './types';

export type ConversationServiceDeps = {
  store: ConversationStore;
  now?: () => Date;
  createId?: () => string;
};

export type TransferToAnalystInput = {
  conversationId: string;
  sessionEmployeeId: string;
  summary: string;
  reasonCode: TransferReasonCode;
};

export type ConversationService = {
  createConversation(employeeId: string): Promise<ConversationRecord>;
  listMyConversations(employeeId: string): Promise<ConversationRecord[]>;
  getConversation(conversationId: string, employeeId: string): Promise<ConversationRecord>;
  listMessages(conversationId: string, employeeId: string): Promise<MessageRecord[]>;
  appendMessage(input: AppendMessageInput): Promise<{
    message: MessageRecord;
    conversation: ConversationRecord;
    trace?: DecisionTraceRecord;
  }>;
  transferToAnalyst(input: TransferToAnalystInput): Promise<ConversationRecord>;
};

function defaultId(): string {
  return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createConversationService(deps: ConversationServiceDeps): ConversationService {
  const store = deps.store;
  const nowFn = deps.now ?? (() => new Date());
  const createId = deps.createId ?? defaultId;

  async function requireOwned(
    conversationId: string,
    employeeId: string,
  ): Promise<ConversationRecord> {
    const conversation = await store.findConversationById(conversationId);
    if (!conversation) throw new ConversationNotFoundError();
    if (conversation.employeeId !== employeeId) {
      throw new ConversationAccessDeniedError();
    }
    return conversation;
  }

  return {
    async createConversation(employeeId) {
      const now = nowFn();
      // Uma sessão ativa por funcionário: encerra WAITING/WITH_* anteriores (seed + /chat paralelo).
      const existing = await store.listConversationsByEmployee(employeeId);
      for (const c of existing) {
        if (c.status === 'CLOSED') continue;
        if (!canTransitionConversation(c.status, 'CLOSED')) continue;
        await store.updateConversationStatus({
          id: c.id,
          status: 'CLOSED',
          updatedAt: now,
        });
      }
      return store.createConversation({ id: createId(), employeeId, now });
    },

    async listMyConversations(employeeId) {
      return store.listConversationsByEmployee(employeeId);
    },

    async getConversation(conversationId, employeeId) {
      return requireOwned(conversationId, employeeId);
    },

    async listMessages(conversationId, employeeId) {
      await requireOwned(conversationId, employeeId);
      return store.listMessages(conversationId);
    },

    async appendMessage(input) {
      return store.runInTransaction(async (tx) => {
        const conversation = await tx.findConversationById(input.conversationId);
        if (!conversation) throw new ConversationNotFoundError();
        if (conversation.employeeId !== input.sessionEmployeeId) {
          throw new ConversationAccessDeniedError();
        }

        // Mensagens do AGENT só com agent ativo (E). Employee pode falar com analista.
        if (input.authorType === 'AGENT' && isAgentPaused(conversation.status)) {
          throw new AgentPausedError();
        }

        if (input.authorType === 'EMPLOYEE') {
          if (input.authorId !== input.sessionEmployeeId) {
            throw new ConversationAccessDeniedError();
          }
        }

        const now = nowFn();
        const counts = countsTowardMessageLimit(input.authorType);

        let nextConversation = conversation;
        if (counts) {
          if (!canAcceptCountableMessage(conversation.messageCount)) {
            throw new MessageLimitExceededError();
          }
          const incremented = await tx.tryIncrementMessageCount(
            conversation.id,
            MESSAGE_LIMIT_PER_CONVERSATION,
          );
          if (!incremented) {
            throw new MessageLimitExceededError();
          }
          nextConversation = incremented;
        }

        const message = await tx.insertMessage({
          id: createId(),
          conversationId: conversation.id,
          authorType: input.authorType,
          authorId: input.authorId,
          content: input.content,
          structuredPayload: input.structuredPayload ?? null,
          createdAt: now,
        });

        let trace: DecisionTraceRecord | undefined;
        if (input.authorType === 'AGENT' && input.decisionTrace) {
          trace = await tx.insertDecisionTrace({
            id: createId(),
            messageId: message.id,
            understoodIntent: input.decisionTrace.understoodIntent,
            actions: input.decisionTrace.actions,
            rationale: input.decisionTrace.rationale,
            policyHits: input.decisionTrace.policyHits,
            toolCalls: input.decisionTrace.toolCalls,
            modelConfidence: input.decisionTrace.modelConfidence ?? null,
            presentedAssurance: input.decisionTrace.presentedAssurance ?? 'UNKNOWN',
            createdAt: now,
          });
        }

        return { message, conversation: nextConversation, trace };
      });
    },

    async transferToAnalyst(input) {
      const conversation = await requireOwned(input.conversationId, input.sessionEmployeeId);
      if (!canTransitionConversation(conversation.status, 'WAITING_ANALYST')) {
        throw new AgentPausedError('Cannot transfer from current status');
      }
      const summary = input.summary.trim();
      if (!summary) {
        throw new ConversationAccessDeniedError('transferSummary required');
      }
      const reqs = transferTransitionRequirements('WAITING_ANALYST');
      if (reqs.requiresTransferSummary && !summary) {
        throw new ConversationAccessDeniedError('transferSummary required');
      }

      return store.updateConversationStatus({
        id: conversation.id,
        status: 'WAITING_ANALYST',
        transferSummary: summary,
        transferReasonCode: normalizeTransferReasonCode(input.reasonCode),
        assignedAnalystId: reqs.assignedAnalystIdMustBeNull ? null : conversation.assignedAnalystId,
        updatedAt: nowFn(),
      });
    },
  };
}
