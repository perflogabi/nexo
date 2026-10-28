import type {
  Category,
  PendingOperation,
  Priority,
  Prisma,
  PrismaClient,
  TicketStatus,
  TicketType,
} from '@prisma/client';
import type { CreateTicketData, StorePending, TicketStore } from './ticket-store';
import type { TicketDraftPayload, TicketEventRecord, TicketRecord } from './types';

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapTicket(row: {
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
}): TicketRecord {
  return { ...row };
}

function mapPending(row: {
  id: string;
  token: string;
  employeeId: string;
  conversationId: string;
  operation: PendingOperation;
  payload: Prisma.JsonValue;
  expiresAt: Date;
  consumedAt: Date | null;
}): StorePending {
  return {
    id: row.id,
    token: row.token,
    employeeId: row.employeeId,
    conversationId: row.conversationId,
    operation: row.operation,
    payload: row.payload as unknown as TicketDraftPayload,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
  };
}

function createStoreForClient(db: DbClient, root: PrismaClient): TicketStore {
  const store: TicketStore = {
    async runInTransaction(fn) {
      return root.$transaction(async (tx) => fn(createStoreForClient(tx, root)));
    },

    async findConversationById(id) {
      const row = await db.conversation.findUnique({
        where: { id },
        select: { id: true, employeeId: true, status: true },
      });
      return row;
    },

    async createPending(input) {
      const row = await db.pendingConfirmation.create({
        data: {
          id: input.id,
          token: input.token,
          employeeId: input.employeeId,
          conversationId: input.conversationId,
          operation: input.operation,
          payload: input.payload as unknown as Prisma.InputJsonValue,
          expiresAt: input.expiresAt,
        },
      });
      return mapPending(row);
    },

    async findPendingByToken(token) {
      const row = await db.pendingConfirmation.findUnique({ where: { token } });
      return row ? mapPending(row) : null;
    },

    async consumePending({ token, sessionEmployeeId, now }) {
      const result = await db.pendingConfirmation.updateMany({
        where: {
          token,
          employeeId: sessionEmployeeId,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (result.count === 0) return null;
      const row = await db.pendingConfirmation.findUnique({ where: { token } });
      return row ? mapPending(row) : null;
    },

    async findTicketById(id) {
      const row = await db.ticket.findUnique({ where: { id } });
      return row ? mapTicket(row) : null;
    },

    async listTicketsByOwner(ownerEmployeeId) {
      const rows = await db.ticket.findMany({
        where: { ownerEmployeeId },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(mapTicket);
    },

    async createTicket(data: CreateTicketData) {
      const row = await db.ticket.create({ data });
      return mapTicket(row);
    },

    async updateTicket(id, patch) {
      const row = await db.ticket.update({ where: { id }, data: patch });
      return mapTicket(row);
    },

    async createEvent(event: TicketEventRecord) {
      const row = await db.ticketEvent.create({
        data: {
          id: event.id,
          ticketId: event.ticketId,
          kind: event.kind,
          summary: event.summary,
          actorType: event.actorType,
          actorId: event.actorId,
          createdAt: event.createdAt,
        },
      });
      return {
        id: row.id,
        ticketId: row.ticketId,
        kind: row.kind,
        summary: row.summary,
        actorType: row.actorType,
        actorId: row.actorId,
        createdAt: row.createdAt,
      };
    },

    async countTicketsByType(type) {
      return db.ticket.count({ where: { type } });
    },
  };

  return store;
}

export function createPrismaTicketStore(prisma: PrismaClient): TicketStore {
  return createStoreForClient(prisma, prisma);
}
