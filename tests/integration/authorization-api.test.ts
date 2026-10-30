import { afterAll, describe, expect, it } from 'vitest';
import { canAnalystAccessConversation } from '@/domain/authorization-scope';
import { createIntegrationClients, uniqueMarker } from './helpers';

describe('I5 analyst authorization scope (with Prisma rows)', () => {
  const { prisma } = createIntegrationClients();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('WAITING_ANALYST acessível a qualquer analista; WITH_ANALYST só assignee', async () => {
    const marker = uniqueMarker('scope');
    const waiting = await prisma.conversation.create({
      data: {
        id: `conv_w_${marker}`,
        employeeId: 'emp_diego',
        status: 'WAITING_ANALYST',
        messageCount: 0,
        transferSummary: marker,
        transferReasonCode: 'USER_REQUEST',
      },
    });

    expect(
      canAnalystAccessConversation({
        analystId: 'emp_analista',
        role: 'ANALYST',
        status: waiting.status,
        assignedAnalystId: waiting.assignedAnalystId,
      }),
    ).toBe(true);

    await prisma.conversation.update({
      where: { id: waiting.id },
      data: { status: 'WITH_ANALYST', assignedAnalystId: 'emp_analista' },
    });

    expect(
      canAnalystAccessConversation({
        analystId: 'emp_analista',
        role: 'ANALYST',
        status: 'WITH_ANALYST',
        assignedAnalystId: 'emp_analista',
      }),
    ).toBe(true);

    expect(
      canAnalystAccessConversation({
        analystId: 'emp_analista_2',
        role: 'ANALYST',
        status: 'WITH_ANALYST',
        assignedAnalystId: 'emp_analista',
      }),
    ).toBe(false);
  });

  it('EMPLOYEE role nunca acessa escopo de analista', () => {
    expect(
      canAnalystAccessConversation({
        analystId: 'emp_ana',
        role: 'EMPLOYEE',
        status: 'WAITING_ANALYST',
        assignedAnalystId: null,
      }),
    ).toBe(false);
  });
});
