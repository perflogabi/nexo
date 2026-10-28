import type {
  Category,
  ConversationStatus,
  PendingOperation,
  Priority,
  TicketStatus,
  TicketType,
} from '@/domain/types';
import type { TicketDraftPayload, TicketEventRecord, TicketRecord } from './types';

export type StoreConversation = {
  id: string;
  employeeId: string;
  status: ConversationStatus;
};

export type StorePending = {
  id: string;
  token: string;
  employeeId: string;
  conversationId: string;
  operation: PendingOperation;
  payload: TicketDraftPayload;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type CreateTicketData = {
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

/**
 * Port de persistência do TicketService.
 * Permite impl in-memory (testes) e Prisma (app) sem acoplar o serviço ao client.
 */
export type TicketStore = {
  runInTransaction<T>(fn: (store: TicketStore) => Promise<T>): Promise<T>;

  findConversationById(id: string): Promise<StoreConversation | null>;

  createPending(input: {
    id: string;
    token: string;
    employeeId: string;
    conversationId: string;
    operation: PendingOperation;
    payload: TicketDraftPayload;
    expiresAt: Date;
  }): Promise<StorePending>;

  findPendingByToken(token: string): Promise<StorePending | null>;

  /**
   * UPDATE condicional: consumedAt IS NULL AND expiresAt > now AND employeeId = session.
   * Retorna null se 0 rows (race / inválido).
   */
  consumePending(input: {
    token: string;
    sessionEmployeeId: string;
    now: Date;
  }): Promise<StorePending | null>;

  findTicketById(id: string): Promise<TicketRecord | null>;

  listTicketsByOwner(ownerEmployeeId: string): Promise<TicketRecord[]>;

  createTicket(data: CreateTicketData): Promise<TicketRecord>;

  updateTicket(
    id: string,
    patch: Partial<
      Pick<
        TicketRecord,
        | 'title'
        | 'description'
        | 'category'
        | 'priority'
        | 'status'
        | 'slaDeadlineAt'
        | 'resolvedAt'
        | 'updatedAt'
      >
    >,
  ): Promise<TicketRecord>;

  createEvent(event: TicketEventRecord): Promise<TicketEventRecord>;

  countTicketsByType(type: TicketType): Promise<number>;
};
