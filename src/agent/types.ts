import type { PresentedAssurance, TransferReasonCode } from '@/domain/types';
import type {
  ConversationRecord,
  DecisionTraceRecord,
  MessageRecord,
} from '@/services/conversations/types';

export type AgentToolCallTrace = {
  name: string;
  ok: boolean;
  summary: string;
};

export type AgentActionChip = {
  code: string;
  label: string;
};

export type AgentDecisionDraft = {
  understoodIntent: string;
  actions: AgentActionChip[];
  rationale: string;
  policyHits: string[];
  toolCalls: AgentToolCallTrace[];
  modelConfidence: number | null;
  presentedAssurance: PresentedAssurance;
};

export type AgentReplyDraft = {
  content: string;
  decision: AgentDecisionDraft;
  /** UI rica no /chat (TicketSelectList / TicketDetailCard). */
  structuredPayload?: unknown;
  /** Se definido, orquestrador aplica WAITING_ANALYST + summary. */
  transfer?: {
    summary: string;
    reasonCode: TransferReasonCode;
  };
  /** Token PendingConfirmation quando prepareTicketDraft rodou. */
  confirmationToken?: string;
};

export type AgentTurnInput = {
  conversationId: string;
  employeeId: string;
  employeeMessage: string;
  recentMessages: Array<{ authorType: string; content: string }>;
};

/** Porta do “cérebro” — mock no CI; Mastra/Gemini em runtime com chave. */
export type AgentBrain = {
  generateReply(input: AgentTurnInput): Promise<AgentReplyDraft>;
};

export type AgentTurnResult = {
  employeeMessage: MessageRecord;
  agentMessage: MessageRecord | null;
  conversation: ConversationRecord;
  trace: DecisionTraceRecord | null;
  confirmationToken?: string;
};
