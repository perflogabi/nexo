import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createIntegrationClients, uniqueMarker } from './helpers';

/**
 * I3 — mesma lógica atômica da rota POST .../claim (updateMany condicional).
 */
describe('I3 claim atomicity (Prisma)', () => {
  const { prisma } = createIntegrationClients();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeAll(async () => {
    await prisma.employee.findFirstOrThrow({ where: { id: 'emp_analista' } });
    await prisma.employee.findFirstOrThrow({ where: { id: 'emp_analista_2' } });
  });

  it('dois claims paralelos: um vence, o outro count=0', async () => {
    const marker = uniqueMarker('claim');
    const conv = await prisma.conversation.create({
      data: {
        id: `conv_${marker}`,
        employeeId: 'emp_bruno',
        status: 'WAITING_ANALYST',
        messageCount: 1,
        transferSummary: `Pedido e2e ${marker}`,
        transferReasonCode: 'USER_REQUEST',
        assignedAnalystId: null,
      },
    });

    const claim = (analystId: string) =>
      prisma.conversation.updateMany({
        where: {
          id: conv.id,
          status: 'WAITING_ANALYST',
          assignedAnalystId: null,
        },
        data: {
          status: 'WITH_ANALYST',
          assignedAnalystId: analystId,
        },
      });

    const [a, b] = await Promise.all([claim('emp_analista'), claim('emp_analista_2')]);
    const counts = [a.count, b.count].sort();
    expect(counts).toEqual([0, 1]);

    const final = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(final.status).toBe('WITH_ANALYST');
    expect(['emp_analista', 'emp_analista_2']).toContain(final.assignedAnalystId);
  });
});
