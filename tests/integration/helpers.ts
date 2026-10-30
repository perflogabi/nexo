import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { createConversationService, createPrismaConversationStore } from '@/services/conversations';
import { createPrismaTicketStore, createTicketService } from '@/services/tickets';

export function requireE2eDatabase(): void {
  if (process.env.E2E_DATABASE_OK !== '1') {
    throw new Error('E2E_DATABASE_OK=1 obrigatório para integração');
  }
  if (process.env.NEXO_ENV !== 'e2e' && process.env.NEXO_ENV !== 'test') {
    throw new Error('NEXO_ENV e2e|test obrigatório para integração');
  }
}

export function createIntegrationClients() {
  requireE2eDatabase();
  const prisma = new PrismaClient();
  const tickets = createTicketService({ store: createPrismaTicketStore(prisma) });
  const conversations = createConversationService({
    store: createPrismaConversationStore(prisma),
  });
  return { prisma, tickets, conversations };
}

export function uniqueMarker(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}
