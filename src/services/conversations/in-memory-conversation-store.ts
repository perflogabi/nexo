import type { ConversationStore } from './conversation-store';
import type { ConversationRecord, DecisionTraceRecord, MessageRecord } from './types';

export function createInMemoryConversationStore(seed?: {
  conversations?: ConversationRecord[];
  messages?: MessageRecord[];
}): ConversationStore {
  const conversations = new Map<string, ConversationRecord>(
    (seed?.conversations ?? []).map((c) => [c.id, { ...c }]),
  );
  const messages = new Map<string, MessageRecord[]>(
    [...new Set((seed?.messages ?? []).map((m) => m.conversationId))].map((id) => [
      id,
      (seed?.messages ?? []).filter((m) => m.conversationId === id).map((m) => ({ ...m })),
    ]),
  );
  const traces = new Map<string, DecisionTraceRecord>();

  const store: ConversationStore = {
    async runInTransaction(fn) {
      const snapConv = new Map([...conversations.entries()].map(([k, v]) => [k, { ...v }]));
      const snapMsg = new Map(
        [...messages.entries()].map(([k, v]) => [k, v.map((m) => ({ ...m }))]),
      );
      const snapTrace = new Map([...traces.entries()].map(([k, v]) => [k, { ...v }]));
      try {
        return await fn(store);
      } catch (e) {
        conversations.clear();
        for (const [k, v] of snapConv) conversations.set(k, v);
        messages.clear();
        for (const [k, v] of snapMsg) messages.set(k, v);
        traces.clear();
        for (const [k, v] of snapTrace) traces.set(k, v);
        throw e;
      }
    },

    async createConversation({ id, employeeId, now }) {
      const row: ConversationRecord = {
        id,
        employeeId,
        status: 'WITH_AGENT',
        messageCount: 0,
        transferSummary: null,
        transferReasonCode: null,
        assignedAnalystId: null,
        createdAt: now,
        updatedAt: now,
      };
      conversations.set(id, row);
      messages.set(id, []);
      return { ...row };
    },

    async findConversationById(id) {
      const row = conversations.get(id);
      return row ? { ...row } : null;
    },

    async listConversationsByEmployee(employeeId) {
      return [...conversations.values()]
        .filter((c) => c.employeeId === employeeId)
        .map((c) => ({ ...c }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },

    async tryIncrementMessageCount(conversationId, limit) {
      const row = conversations.get(conversationId);
      if (!row) return null;
      if (row.messageCount >= limit) return null;
      row.messageCount += 1;
      row.updatedAt = new Date(row.updatedAt.getTime() + 1);
      return { ...row };
    },

    async insertMessage(input) {
      const list = messages.get(input.conversationId) ?? [];
      const row: MessageRecord = {
        id: input.id,
        conversationId: input.conversationId,
        authorType: input.authorType,
        authorId: input.authorId,
        content: input.content,
        structuredPayload: input.structuredPayload,
        createdAt: input.createdAt,
      };
      list.push(row);
      messages.set(input.conversationId, list);
      return { ...row };
    },

    async insertDecisionTrace(input) {
      const row: DecisionTraceRecord = { ...input };
      traces.set(row.messageId, row);
      return { ...row };
    },

    async listMessages(conversationId) {
      return (messages.get(conversationId) ?? []).map((m) => ({ ...m }));
    },

    async updateConversationStatus(input) {
      const row = conversations.get(input.id);
      if (!row) throw new Error('Conversation not found');
      row.status = input.status;
      if (input.transferSummary !== undefined) row.transferSummary = input.transferSummary;
      if (input.transferReasonCode !== undefined) {
        row.transferReasonCode = input.transferReasonCode;
      }
      if (input.assignedAnalystId !== undefined) {
        row.assignedAnalystId = input.assignedAnalystId;
      }
      row.updatedAt = input.updatedAt;
      return { ...row };
    },
  };

  return store;
}
