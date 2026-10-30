import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfirmationInvalidError, TicketAccessDeniedError } from '@/domain/errors';
import { createIntegrationClients, uniqueMarker } from './helpers';

describe('I1/I2 confirmation persistence (Prisma)', () => {
  const clients = createIntegrationClients();
  const { prisma, tickets, conversations } = clients;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    await prisma.employee.findFirstOrThrow({ where: { id: 'emp_ana' } });
  });

  it('I1: prepare não cria ticket; confirm 1× cria; reuse não cria outro', async () => {
    const marker = uniqueMarker('confirm');
    const conv = await conversations.createConversation('emp_ana');

    const prepared = await tickets.prepareTicketDraft({
      sessionEmployeeId: 'emp_ana',
      conversationId: conv.id,
      operation: 'CREATE',
      payload: {
        type: 'INC',
        title: `Monitor HDMI ${marker}`,
        description: `QA E2E marker ${marker}`,
        category: 'HARDWARE',
        priority: 'MEDIUM',
        affectedEmployeeId: 'emp_ana',
      },
    });

    const before = await prisma.ticket.findMany({
      where: { ownerEmployeeId: 'emp_ana', title: { contains: marker } },
    });
    expect(before).toHaveLength(0);

    const confirmed = await tickets.confirmTicketMutation({
      token: prepared.token,
      sessionEmployeeId: 'emp_ana',
      expectedConversationId: conv.id,
    });
    expect(confirmed.ticket.title).toContain(marker);

    const after = await prisma.ticket.findMany({
      where: { ownerEmployeeId: 'emp_ana', title: { contains: marker } },
    });
    expect(after).toHaveLength(1);

    await expect(
      tickets.confirmTicketMutation({
        token: prepared.token,
        sessionEmployeeId: 'emp_ana',
        expectedConversationId: conv.id,
      }),
    ).rejects.toBeInstanceOf(ConfirmationInvalidError);

    const still = await prisma.ticket.findMany({
      where: { ownerEmployeeId: 'emp_ana', title: { contains: marker } },
    });
    expect(still).toHaveLength(1);
  });

  it('I2: confirm de outro employee é negado', async () => {
    const marker = uniqueMarker('xuser');
    const conv = await conversations.createConversation('emp_ana');
    const prepared = await tickets.prepareTicketDraft({
      sessionEmployeeId: 'emp_ana',
      conversationId: conv.id,
      operation: 'CREATE',
      payload: {
        type: 'INC',
        title: `Cross ${marker}`,
        description: marker,
        category: 'SOFTWARE',
        priority: 'LOW',
        affectedEmployeeId: 'emp_ana',
      },
    });

    await expect(
      tickets.confirmTicketMutation({
        token: prepared.token,
        sessionEmployeeId: 'emp_carla_mendes',
        expectedConversationId: conv.id,
      }),
    ).rejects.toBeInstanceOf(ConfirmationInvalidError);

    const rows = await prisma.ticket.findMany({
      where: { title: { contains: marker } },
    });
    expect(rows).toHaveLength(0);
  });

  it('I4: getTicket de outro owner é negado', async () => {
    const marker = uniqueMarker('authz');
    const conv = await conversations.createConversation('emp_ana');
    const prepared = await tickets.prepareTicketDraft({
      sessionEmployeeId: 'emp_ana',
      conversationId: conv.id,
      operation: 'CREATE',
      payload: {
        type: 'INC',
        title: `Priv ${marker}`,
        description: marker,
        category: 'EMAIL',
        priority: 'LOW',
        affectedEmployeeId: 'emp_ana',
      },
    });
    const { ticket } = await tickets.confirmTicketMutation({
      token: prepared.token,
      sessionEmployeeId: 'emp_ana',
      expectedConversationId: conv.id,
    });

    await expect(tickets.getTicket(ticket.id, 'emp_carla_mendes')).rejects.toBeInstanceOf(
      TicketAccessDeniedError,
    );
  });
});
