/**
 * Orquestra um turno: employee msg → brain → agent msg + DecisionTrace
 * → (opcional) transferência WAITING_ANALYST.
 * Transferência só depois da reply do agent (senão AGENT fica bloqueado por pause).
 */

import { isAgentPaused } from '@/domain/conversation-status';
import {
  AgentPausedError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  MessageLimitExceededError,
} from '@/domain/errors';
import { canAcceptCountableMessage } from '@/domain/message-limit';
import type { AgentBrain, AgentTurnResult } from '@/agent/types';
import type { ConversationService } from '@/services/conversations';

export type OrchestratorDeps = {
  conversations: ConversationService;
  brain: AgentBrain;
};

export type RunEmployeeTurnInput = {
  conversationId: string;
  employeeId: string;
  content: string;
};

export function createAgentOrchestrator(deps: OrchestratorDeps) {
  const { conversations, brain } = deps;

  return {
    async runEmployeeTurn(input: RunEmployeeTurnInput): Promise<AgentTurnResult> {
      const conversation = await conversations.getConversation(
        input.conversationId,
        input.employeeId,
      );

      if (conversation.status === 'CLOSED') {
        throw new ConversationAccessDeniedError('Conversation is closed');
      }

      // Com analista: só persiste fala do funcionário (agent pausado).
      if (isAgentPaused(conversation.status)) {
        const employeeOnly = await conversations.appendMessage({
          conversationId: input.conversationId,
          sessionEmployeeId: input.employeeId,
          authorType: 'EMPLOYEE',
          authorId: input.employeeId,
          content: input.content,
        });
        return {
          employeeMessage: employeeOnly.message,
          agentMessage: null,
          conversation: employeeOnly.conversation,
          trace: null,
        };
      }

      // Precisa de 2 slots (employee + agent).
      if (!canAcceptCountableMessage(conversation.messageCount + 1)) {
        throw new MessageLimitExceededError();
      }

      const recent = await conversations.listMessages(input.conversationId, input.employeeId);
      const employeeAppend = await conversations.appendMessage({
        conversationId: input.conversationId,
        sessionEmployeeId: input.employeeId,
        authorType: 'EMPLOYEE',
        authorId: input.employeeId,
        content: input.content,
      });

      const draft = await brain.generateReply({
        conversationId: input.conversationId,
        employeeId: input.employeeId,
        employeeMessage: input.content,
        recentMessages: [
          ...recent.map((m) => ({ authorType: m.authorType, content: m.content })),
          { authorType: 'EMPLOYEE', content: input.content },
        ],
      });

      const agentAppend = await conversations.appendMessage({
        conversationId: input.conversationId,
        sessionEmployeeId: input.employeeId,
        authorType: 'AGENT',
        authorId: null,
        content: draft.content,
        structuredPayload: draft.structuredPayload ?? null,
        decisionTrace: {
          understoodIntent: draft.decision.understoodIntent,
          actions: draft.decision.actions,
          rationale: draft.decision.rationale,
          policyHits: draft.decision.policyHits,
          toolCalls: draft.decision.toolCalls,
          modelConfidence: draft.decision.modelConfidence,
          presentedAssurance: draft.decision.presentedAssurance,
        },
      });

      let finalConversation = agentAppend.conversation;

      if (draft.transfer) {
        finalConversation = await conversations.transferToAnalyst({
          conversationId: input.conversationId,
          sessionEmployeeId: input.employeeId,
          summary: draft.transfer.summary,
          reasonCode: draft.transfer.reasonCode,
        });

        await conversations.appendMessage({
          conversationId: input.conversationId,
          sessionEmployeeId: input.employeeId,
          authorType: 'SYSTEM',
          authorId: null,
          content: 'Transferida para Suporte N2',
        });
        finalConversation = await conversations.getConversation(
          input.conversationId,
          input.employeeId,
        );
      }

      return {
        employeeMessage: employeeAppend.message,
        agentMessage: agentAppend.message,
        conversation: finalConversation,
        trace: agentAppend.trace ?? null,
        confirmationToken: draft.confirmationToken,
      };
    },
  };
}

export type AgentOrchestrator = ReturnType<typeof createAgentOrchestrator>;

export {
  AgentPausedError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  MessageLimitExceededError,
};
