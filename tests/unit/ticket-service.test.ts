import { describe, expect, it } from 'vitest';
import {
  ConfirmationInvalidError,
  TicketAccessDeniedError,
  TicketNotFoundError,
  TicketServiceUnavailableError,
} from '@/domain/errors';
import { createInMemoryTicketStore } from '@/services/tickets/in-memory-ticket-store';
import { createIntermittentFailurePolicy } from '@/services/tickets/intermittent-failure';
import { createTicketService } from '@/services/tickets/ticket-service';
import type { TicketRecord } from '@/services/tickets/types';

const NOW = new Date('2026-07-01T12:00:00.000Z');

function buildService(options?: { failureRate?: number; random?: () => number }) {
  let seq = 0;
  const store = createInMemoryTicketStore({
    conversations: [
      { id: 'conv-1', employeeId: 'emp-a', status: 'WITH_AGENT' },
      { id: 'conv-paused', employeeId: 'emp-a', status: 'WAITING_ANALYST' },
    ],
  });

  const service = createTicketService({
    store,
    now: () => NOW,
    createId: () => `id-${++seq}`,
    createToken: () => `tok-${seq + 1}`,
    failure: createIntermittentFailurePolicy({
      failureRate: options?.failureRate ?? 0,
      random: options?.random ?? (() => 1),
    }),
  });

  return { service, store };
}

const createDraft = {
  type: 'INC' as const,
  title: 'VPN erro 809',
  description: 'Falha ao conectar',
  category: 'REDE_VPN' as const,
  priority: 'HIGH' as const,
  affectedEmployeeId: 'emp-a',
};

describe('TicketService reads + authz', () => {
  it('lists and gets only owner tickets', async () => {
    const { service, store } = buildService();
    const owned: TicketRecord = {
      id: 't-a',
      number: 'INC-0001',
      type: 'INC',
      title: 'A',
      description: 'd',
      category: 'EMAIL',
      priority: 'LOW',
      status: 'OPEN',
      ownerEmployeeId: 'emp-a',
      affectedEmployeeId: 'emp-a',
      slaDeadlineAt: NOW,
      resolvedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    const other = { ...owned, id: 't-b', number: 'INC-0002', ownerEmployeeId: 'emp-b' };
    await store.createTicket(owned);
    await store.createTicket(other);

    const list = await service.listMyTickets('emp-a');
    expect(list.map((t) => t.id)).toEqual(['t-a']);

    await expect(service.getTicket('t-a', 'emp-a')).resolves.toMatchObject({ id: 't-a' });
    await expect(service.getTicket('t-b', 'emp-a')).rejects.toBeInstanceOf(TicketAccessDeniedError);
    await expect(service.getTicket('missing', 'emp-a')).rejects.toBeInstanceOf(TicketNotFoundError);
  });

  it('does not grant access via affectedEmployeeId alone', async () => {
    const { service, store } = buildService();
    await store.createTicket({
      id: 't-aff',
      number: 'INC-0099',
      type: 'INC',
      title: 'X',
      description: 'd',
      category: 'HARDWARE',
      priority: 'LOW',
      status: 'OPEN',
      ownerEmployeeId: 'emp-b',
      affectedEmployeeId: 'emp-a',
      slaDeadlineAt: NOW,
      resolvedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await expect(service.getTicket('t-aff', 'emp-a')).rejects.toBeInstanceOf(
      TicketAccessDeniedError,
    );
  });
});

describe('TicketService confirmation flow', () => {
  it('creates ticket only after confirm (prepare + confirm)', async () => {
    const { service } = buildService();
    const prepared = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: createDraft,
    });

    expect(prepared.token).toMatch(/^tok-/);
    await expect(service.listMyTickets('emp-a')).resolves.toHaveLength(0);

    const confirmed = await service.confirmTicketMutation({
      token: prepared.token,
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });

    expect(confirmed.ticket.status).toBe('OPEN');
    expect(confirmed.ticket.number).toBe('INC-0001');
    expect(confirmed.event.kind).toBe('CREATED');
    await expect(service.listMyTickets('emp-a')).resolves.toHaveLength(1);
  });

  it('rejects reuse of the same token', async () => {
    const { service } = buildService();
    const prepared = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: createDraft,
    });
    await service.confirmTicketMutation({
      token: prepared.token,
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });
    await expect(
      service.confirmTicketMutation({
        token: prepared.token,
        sessionEmployeeId: 'emp-a',
        expectedConversationId: 'conv-1',
      }),
    ).rejects.toBeInstanceOf(ConfirmationInvalidError);
  });

  it('rejects confirm for another employee', async () => {
    const { service } = buildService();
    const prepared = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: createDraft,
    });
    await expect(
      service.confirmTicketMutation({
        token: prepared.token,
        sessionEmployeeId: 'emp-b',
        expectedConversationId: 'conv-1',
      }),
    ).rejects.toMatchObject({ reason: 'WRONG_EMPLOYEE' });
  });

  it('normalizes INCIDENT / free-text category on confirm (Gemini-like payload)', async () => {
    const { service } = buildService();
    const prepared = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: {
        ...createDraft,
        type: 'INCIDENT' as unknown as 'INC',
        category: 'Rede e Conectividade' as unknown as 'REDE_VPN',
        priority: 'Média' as unknown as 'MEDIUM',
        title: 'VPN cai a cada 30 segundos',
      },
    });
    const confirmed = await service.confirmTicketMutation({
      token: prepared.token,
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });
    expect(confirmed.ticket.type).toBe('INC');
    expect(confirmed.ticket.category).toBe('REDE_VPN');
    expect(confirmed.ticket.priority).toBe('MEDIUM');
    expect(confirmed.ticket.number).toMatch(/^INC-/);
  });

  it('rejects confirm when URL conversationId mismatches pending', async () => {
    const { service } = buildService();
    const prepared = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: createDraft,
    });
    await expect(
      service.confirmTicketMutation({
        token: prepared.token,
        sessionEmployeeId: 'emp-a',
        expectedConversationId: 'conv-other',
      }),
    ).rejects.toMatchObject({ reason: 'CONVERSATION_MISMATCH' });
  });

  it('updates and reopens with TicketEvent', async () => {
    const { service, store } = buildService();
    await store.createTicket({
      id: 't-open',
      number: 'INC-0001',
      type: 'INC',
      title: 'Old',
      description: 'old',
      category: 'REDE_VPN',
      priority: 'LOW',
      status: 'OPEN',
      ownerEmployeeId: 'emp-a',
      affectedEmployeeId: 'emp-a',
      slaDeadlineAt: NOW,
      resolvedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const upd = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'UPDATE',
      payload: {
        ...createDraft,
        ticketId: 't-open',
        title: 'VPN erro 809 atualizado',
        priority: 'HIGH',
      },
    });
    const updated = await service.confirmTicketMutation({
      token: upd.token,
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });
    expect(updated.ticket.title).toContain('atualizado');
    expect(updated.event.kind).toBe('PRIORITY_CHANGED');

    await store.updateTicket('t-open', {
      status: 'RESOLVED',
      resolvedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
    });

    const reo = await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'REOPEN',
      payload: { ...createDraft, ticketId: 't-open' },
    });
    const reopened = await service.confirmTicketMutation({
      token: reo.token,
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });
    expect(reopened.ticket.status).toBe('OPEN');
    expect(reopened.ticket.resolvedAt).toBeNull();
    expect(reopened.event.kind).toBe('REOPENED');
  });

  it('blocks prepare when agent is paused', async () => {
    const { service } = buildService();
    await expect(
      service.prepareTicketDraft({
        sessionEmployeeId: 'emp-a',
        conversationId: 'conv-paused',
        operation: 'CREATE',
        payload: createDraft,
      }),
    ).rejects.toMatchObject({ reason: 'AGENT_PAUSED' });
  });

  it('rolls back token consumption if mutation path fails after consume simulation', async () => {
    // consume succeeds then createTicket throws — in-memory tx rollback restores pending
    const store = createInMemoryTicketStore({
      conversations: [{ id: 'conv-1', employeeId: 'emp-a', status: 'WITH_AGENT' }],
    });
    const originalCreate = store.createTicket.bind(store);
    let once = true;
    store.createTicket = async (data) => {
      if (once) {
        once = false;
        throw new Error('boom');
      }
      return originalCreate(data);
    };

    let seq = 0;
    const service = createTicketService({
      store,
      now: () => NOW,
      createId: () => `id-${++seq}`,
      createToken: () => 'tok-fixed',
    });

    await service.prepareTicketDraft({
      sessionEmployeeId: 'emp-a',
      conversationId: 'conv-1',
      operation: 'CREATE',
      payload: createDraft,
    });

    await expect(
      service.confirmTicketMutation({
        token: 'tok-fixed',
        sessionEmployeeId: 'emp-a',
        expectedConversationId: 'conv-1',
      }),
    ).rejects.toThrow('boom');

    // token still consumable after rollback
    const retry = await service.confirmTicketMutation({
      token: 'tok-fixed',
      sessionEmployeeId: 'emp-a',
      expectedConversationId: 'conv-1',
    });
    expect(retry.ticket.number).toBe('INC-0001');
  });
});

describe('intermittent failure', () => {
  it('throws TicketServiceUnavailableError when policy fires', async () => {
    const { service } = buildService({ failureRate: 1, random: () => 0 });
    await expect(service.listMyTickets('emp-a')).rejects.toBeInstanceOf(
      TicketServiceUnavailableError,
    );
  });
});
