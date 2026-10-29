import { createAgentBrain } from '@/agent/create-brain';
import { createAgentOrchestrator } from '@/agent/orchestrator';
import type { AgentToolContext } from '@/agent/tools/tool-context';
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

let toolContextHolder: AgentToolContext | null = null;

function getToolContext(): AgentToolContext {
  if (!toolContextHolder) {
    throw new Error('Agent tool context not bound for this request');
  }
  return toolContextHolder;
}

export function getAgentOrchestrator() {
  const conversations = getConversationService();
  const tickets = getTicketService();
  const help = getHelpCenterService();
  const brain = createAgentBrain(() => getToolContext());

  return {
    bindContext(ctx: Omit<AgentToolContext, 'tickets' | 'help' | 'conversations'>) {
      toolContextHolder = {
        ...ctx,
        tickets,
        help,
        conversations,
      };
    },
    clearContext() {
      toolContextHolder = null;
    },
    orchestrator: createAgentOrchestrator({ conversations, brain }),
  };
}
