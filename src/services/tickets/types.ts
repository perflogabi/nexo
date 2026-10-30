import type {
  Category,
  PendingOperation,
  Priority,
  TicketStatus,
  TicketType,
} from '@/domain/types';

export type TicketRecord = {
  id: string;
  number: string;
  type: TicketType;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  ownerEmployeeId: string;
  affectedEmployeeId: string;
  slaDeadlineAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketEventRecord = {
  id: string;
  ticketId: string;
  kind: 'CREATED' | 'UPDATED' | 'REOPENED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED';
  summary: string;
  actorType: 'EMPLOYEE' | 'AGENT' | 'ANALYST' | 'SYSTEM';
  actorId: string | null;
  createdAt: Date;
};

export type TicketDraftPayload = {
  ticketId?: string;
  type: TicketType;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  affectedEmployeeId: string;
};

export type PrepareTicketDraftInput = {
  sessionEmployeeId: string;
  conversationId: string;
  operation: PendingOperation;
  payload: TicketDraftPayload;
  /** TTL override (H); default domain 30 min. */
  ttlMs?: number;
};

export type PrepareTicketDraftResult = {
  token: string;
  expiresAt: Date;
  operation: PendingOperation;
};

export type ConfirmTicketMutationInput = {
  token: string;
  sessionEmployeeId: string;
  /** Id da conversa na URL — deve bater com o pending (evita token cross-conversation). */
  expectedConversationId: string;
};

export type ConfirmTicketMutationResult = {
  ticket: TicketRecord;
  event: TicketEventRecord;
};
