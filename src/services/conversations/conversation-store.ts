import type { AuthorType, ConversationStatus, PresentedAssurance } from '@/domain/types';
import type { ConversationRecord, DecisionTraceRecord, MessageRecord } from './types';

export type ConversationStore = {
  runInTransaction<T>(fn: (store: ConversationStore) => Promise<T>): Promise<T>;

  createConversation(input: {
    id: string;
    employeeId: string;
    now: Date;
  }): Promise<ConversationRecord>;

  findConversationById(id: string): Promise<ConversationRecord | null>;

  listConversationsByEmployee(employeeId: string): Promise<ConversationRecord[]>;

  /**
   * UPDATE … SET messageCount = messageCount + 1
   * WHERE id = $id AND messageCount < 30
   * Retorna null se 0 rows (limite).
   */
  tryIncrementMessageCount(
    conversationId: string,
    limit: number,
  ): Promise<ConversationRecord | null>;

  insertMessage(input: {
    id: string;
    conversationId: string;
    authorType: AuthorType;
    authorId: string | null;
    content: string;
    structuredPayload: unknown | null;
    createdAt: Date;
  }): Promise<MessageRecord>;

  insertDecisionTrace(input: {
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
  }): Promise<DecisionTraceRecord>;

  listMessages(conversationId: string): Promise<MessageRecord[]>;

  updateConversationStatus(input: {
    id: string;
    status: ConversationStatus;
    transferSummary?: string | null;
    transferReasonCode?: ConversationRecord['transferReasonCode'];
    assignedAnalystId?: string | null;
    updatedAt: Date;
  }): Promise<ConversationRecord>;
};
