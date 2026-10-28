import type { Prisma, PrismaClient } from '@prisma/client';
import type { ConversationStore } from './conversation-store';
import type { ConversationRecord, MessageRecord } from './types';

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapConversation(row: {
  id: string;
  employeeId: string;
  status: ConversationRecord['status'];
  messageCount: number;
  transferSummary: string | null;
  transferReasonCode: ConversationRecord['transferReasonCode'];
  assignedAnalystId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversationRecord {
  return { ...row };
}

function mapMessage(row: {
  id: string;
  conversationId: string;
  authorType: MessageRecord['authorType'];
  authorId: string | null;
  content: string;
  structuredPayload: Prisma.JsonValue | null;
  createdAt: Date;
}): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    authorType: row.authorType,
    authorId: row.authorId,
    content: row.content,
    structuredPayload: row.structuredPayload,
    createdAt: row.createdAt,
  };
}

function createStoreForClient(db: DbClient, root: PrismaClient): ConversationStore {
  const store: ConversationStore = {
    async runInTransaction(fn) {
      return root.$transaction(async (tx) => fn(createStoreForClient(tx, root)));
    },

    async createConversation({ id, employeeId, now }) {
      const row = await db.conversation.create({
        data: {
          id,
          employeeId,
          status: 'WITH_AGENT',
          messageCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      });
      return mapConversation(row);
    },

    async findConversationById(id) {
      const row = await db.conversation.findUnique({ where: { id } });
      return row ? mapConversation(row) : null;
    },

    async listConversationsByEmployee(employeeId) {
      const rows = await db.conversation.findMany({
        where: { employeeId },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(mapConversation);
    },

    async tryIncrementMessageCount(conversationId, limit) {
      const result = await db.conversation.updateMany({
        where: { id: conversationId, messageCount: { lt: limit } },
        data: { messageCount: { increment: 1 } },
      });
      if (result.count === 0) return null;
      const row = await db.conversation.findUnique({ where: { id: conversationId } });
      return row ? mapConversation(row) : null;
    },

    async insertMessage(input) {
      const row = await db.message.create({
        data: {
          id: input.id,
          conversationId: input.conversationId,
          authorType: input.authorType,
          authorId: input.authorId,
          content: input.content,
          structuredPayload:
            input.structuredPayload === null || input.structuredPayload === undefined
              ? undefined
              : (input.structuredPayload as Prisma.InputJsonValue),
          createdAt: input.createdAt,
        },
      });
      return mapMessage(row);
    },

    async insertDecisionTrace(input) {
      const row = await db.decisionTrace.create({
        data: {
          id: input.id,
          messageId: input.messageId,
          understoodIntent: input.understoodIntent,
          actions: input.actions as Prisma.InputJsonValue,
          rationale: input.rationale,
          policyHits: input.policyHits as Prisma.InputJsonValue,
          toolCalls: input.toolCalls as Prisma.InputJsonValue,
          modelConfidence: input.modelConfidence,
          presentedAssurance: input.presentedAssurance,
          createdAt: input.createdAt,
        },
      });
      return {
        id: row.id,
        messageId: row.messageId,
        understoodIntent: row.understoodIntent,
        actions: row.actions,
        rationale: row.rationale,
        policyHits: row.policyHits,
        toolCalls: row.toolCalls,
        modelConfidence: row.modelConfidence,
        presentedAssurance: row.presentedAssurance,
        createdAt: row.createdAt,
      };
    },

    async listMessages(conversationId) {
      const rows = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map(mapMessage);
    },

    async updateConversationStatus(input) {
      const row = await db.conversation.update({
        where: { id: input.id },
        data: {
          status: input.status,
          transferSummary: input.transferSummary,
          transferReasonCode: input.transferReasonCode,
          assignedAnalystId: input.assignedAnalystId,
          updatedAt: input.updatedAt,
        },
      });
      return mapConversation(row);
    },
  };

  return store;
}

export function createPrismaConversationStore(prisma: PrismaClient): ConversationStore {
  return createStoreForClient(prisma, prisma);
}
