import { createAgentBrain } from '@/agent/create-brain';
import { createAgentOrchestrator } from '@/agent/orchestrator';
import { getAgentToolContext } from '@/lib/agent-tool-context';
import { createAuthService, createPrismaEmployeeDirectory } from '@/services/auth';
import { createConversationService, createPrismaConversationStore } from '@/services/conversations';
import { createPrismaHelpCenter } from '@/services/help-center';
import { createTicketService, createPrismaTicketStore } from '@/services/tickets';
import { prisma } from '@/lib/prisma';

export function getAuthService() {
  return createAuthService(createPrismaEmployeeDirectory(prisma));
}

export function getConversationService() {
  return createConversationService({
    store: createPrismaConversationStore(prisma),
  });
}

export function getTicketService() {
  return createTicketService({
    store: createPrismaTicketStore(prisma),
  });
}

export function getHelpCenterService() {
  return createPrismaHelpCenter(prisma);
}

/** Orquestrador; tools leem o contexto via AsyncLocalStorage (ver runWithAgentToolContext). */
export function getAgentOrchestrator() {
  const conversations = getConversationService();
  const brain = createAgentBrain(() => getAgentToolContext());
  return createAgentOrchestrator({ conversations, brain });
}

export function buildAgentToolContext(input: { employeeId: string; conversationId: string }) {
  return {
    employeeId: input.employeeId,
    conversationId: input.conversationId,
    tickets: getTicketService(),
    help: getHelpCenterService(),
    conversations: getConversationService(),
  };
}
