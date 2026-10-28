import type {
  AuthorType,
  ConversationStatus,
  PresentedAssurance,
  TransferReasonCode,
} from '@/domain/types';

export type ConversationRecord = {
  id: string;
  employeeId: string;
  status: ConversationStatus;
  messageCount: number;
  transferSummary: string | null;
  transferReasonCode: TransferReasonCode | null;
  assignedAnalystId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  authorType: AuthorType;
  authorId: string | null;
  content: string;
  structuredPayload: unknown | null;
  createdAt: Date;
};

export type DecisionTraceRecord = {
  id: string;
  messageId: string;
  understoodIntent: string;
  actions: unknown;
  rationale: string;
  policyHits: unknown;
  toolCalls: unknown;
  modelConfidence: number | null;
  presentedAssurance: PresentedAssurance;
  createdAt: Date;
};

export type AppendMessageInput = {
  conversationId: string;
  sessionEmployeeId: string;
  authorType: AuthorType;
  authorId: string | null;
  content: string;
  structuredPayload?: unknown | null;
  /** Se authorType=AGENT, pode anexar DecisionTrace na mesma operação. */
  decisionTrace?: {
    understoodIntent: string;
    actions: unknown;
    rationale: string;
    policyHits: unknown;
    toolCalls: unknown;
    modelConfidence?: number | null;
    presentedAssurance?: PresentedAssurance;
  };
};
