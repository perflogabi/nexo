import type { TicketType } from '@/domain/types';
import type {
  CreateTicketData,
  StoreConversation,
  StorePending,
  TicketStore,
} from './ticket-store';
import type { TicketEventRecord, TicketRecord } from './types';

/**
 * Store em memória para testes unitários do TicketService (sem Neon).
 */
export function createInMemoryTicketStore(seed?: {
  conversations?: StoreConversation[];
  tickets?: TicketRecord[];
}): TicketStore {
  const conversations = new Map<string, StoreConversation>(
    (seed?.conversations ?? []).map((c) => [c.id, { ...c }]),
  );
  const pendings = new Map<string, StorePending>();
  const tickets = new Map<string, TicketRecord>((seed?.tickets ?? []).map((t) => [t.id, { ...t }]));
  const events: TicketEventRecord[] = [];

  const store: TicketStore = {
    async runInTransaction(fn) {
      const snap = {
        pendings: new Map(
          [...pendings.entries()].map(([k, v]) => [k, { ...v, payload: { ...v.payload } }]),
        ),
        tickets: new Map([...tickets.entries()].map(([k, v]) => [k, { ...v }])),
        eventsLen: events.length,
      };
      try {
        return await fn(store);
      } catch (e) {
        pendings.clear();
        for (const [k, v] of snap.pendings) pendings.set(k, v);
        tickets.clear();
        for (const [k, v] of snap.tickets) tickets.set(k, v);
        events.length = snap.eventsLen;
        throw e;
      }
    },

    async findConversationById(id) {
      return conversations.get(id) ?? null;
    },

    async createPending(input) {
      const row: StorePending = {
        ...input,
        payload: { ...input.payload },
        consumedAt: null,
      };
      pendings.set(row.token, row);
      return { ...row, payload: { ...row.payload } };
    },

    async findPendingByToken(token) {
      const row = pendings.get(token);
      return row ? { ...row, payload: { ...row.payload } } : null;
    },

    async consumePending({ token, sessionEmployeeId, now }) {
      const row = pendings.get(token);
      if (!row) return null;
      if (row.employeeId !== sessionEmployeeId) return null;
      if (row.consumedAt != null) return null;
      if (row.expiresAt.getTime() <= now.getTime()) return null;
      row.consumedAt = now;
      return { ...row, payload: { ...row.payload } };
    },

    async findTicketById(id) {
      const t = tickets.get(id);
      return t ? { ...t } : null;
    },

    async listTicketsByOwner(ownerEmployeeId) {
      return [...tickets.values()]
        .filter((t) => t.ownerEmployeeId === ownerEmployeeId)
        .map((t) => ({ ...t }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },

    async createTicket(data: CreateTicketData) {
      const row = { ...data };
      tickets.set(row.id, row);
      return { ...row };
    },

    async updateTicket(id, patch) {
      const current = tickets.get(id);
      if (!current) throw new Error(`Ticket ${id} not found in memory store`);
      const next = { ...current, ...patch };
      tickets.set(id, next);
      return { ...next };
    },

    async createEvent(event) {
      events.push({ ...event });
      return { ...event };
    },

    async countTicketsByType(type: TicketType) {
      return [...tickets.values()].filter((t) => t.type === type).length;
    },
  };

  return store;
}
