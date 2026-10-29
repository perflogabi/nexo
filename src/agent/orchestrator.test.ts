import { describe, expect, it } from 'vitest';
import { createAgentOrchestrator } from '@/agent/orchestrator';
import { createMockAgentBrain } from '@/agent/mock-brain';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  createConversationService,
  createInMemoryConversationStore,
} from '@/services/conversations';
import { createInMemoryHelpCenter } from '@/services/help-center';
import { createInMemoryTicketStore, createTicketService } from '@/services/tickets';

function setup() {
  const convStore = createInMemoryConversationStore();
  const conversations = createConversationService({ store: convStore });
  const tickets = createTicketService({ store: createInMemoryTicketStore() });
  const help = createInMemoryHelpCenter([
    {
      id: 'a1',
      slug: 'vpn-erro-809',
      title: 'VPN — erro 809',
      body: 'Reinicie o cliente e confira o gateway.',
      tags: ['vpn', '809'],
    },
  ]);
  return { conversations, tickets, help };
}

describe('AgentOrchestrator (mock brain)', () => {
  it('responde com DecisionTrace e pausa após pedido de analista', async () => {
    const { conversations, tickets, help } = setup();
    const conversation = await conversations.createConversation('emp_1');
    const ctx: AgentToolContext = {
      employeeId: 'emp_1',
      conversationId: conversation.id,
      tickets,
      help,
      conversations,
    };
    const orch = createAgentOrchestrator({
      conversations,
      brain: createMockAgentBrain(() => ctx),
    });

    const result = await orch.runEmployeeTurn({
      conversationId: conversation.id,
      employeeId: 'emp_1',
      content: 'Quero falar com um analista agora',
    });

    expect(result.agentMessage?.content).toMatch(/analista/i);
    expect(result.trace?.understoodIntent).toBe('request_analyst');
    expect(result.conversation.status).toBe('WAITING_ANALYST');
    expect(result.conversation.transferSummary).toBeTruthy();

    const paused = await orch.runEmployeeTurn({
      conversationId: conversation.id,
      employeeId: 'emp_1',
      content: 'Ainda estou aqui',
    });
    expect(paused.agentMessage).toBeNull();
    expect(paused.conversation.status).toBe('WAITING_ANALYST');
  });

  it('consulta help center para VPN', async () => {
    const { conversations, tickets, help } = setup();
    const conversation = await conversations.createConversation('emp_1');
    const ctx: AgentToolContext = {
      employeeId: 'emp_1',
      conversationId: conversation.id,
      tickets,
      help,
      conversations,
    };
    const orch = createAgentOrchestrator({
      conversations,
      brain: createMockAgentBrain(() => ctx),
    });

    const result = await orch.runEmployeeTurn({
      conversationId: conversation.id,
      employeeId: 'emp_1',
      content: 'VPN com erro 809',
    });

    expect(result.conversation.status).toBe('WITH_AGENT');
    expect(result.agentMessage?.content).toMatch(/VPN/i);
    expect(result.trace?.toolCalls).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'searchHelpCenter', ok: true })]),
    );
  });
});
