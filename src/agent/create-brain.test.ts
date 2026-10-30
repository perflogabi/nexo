import { describe, expect, it, vi } from 'vitest';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  createConversationService,
  createInMemoryConversationStore,
} from '@/services/conversations';
import { createInMemoryHelpCenter } from '@/services/help-center';
import { createInMemoryTicketStore, createTicketService } from '@/services/tickets';

function ctx(): AgentToolContext {
  const conversations = createConversationService({
    store: createInMemoryConversationStore(),
  });
  return {
    employeeId: 'emp_1',
    conversationId: 'c1',
    tickets: createTicketService({ store: createInMemoryTicketStore() }),
    help: createInMemoryHelpCenter([]),
    conversations,
  };
}

describe('createGeminiOnlyBrain', () => {
  it('propaga erro quando Gemini lança (sem fallback mock)', async () => {
    vi.resetModules();
    vi.doMock('@/agent/gemini-brain', () => ({
      createGeminiAgentBrain: () => ({
        generateReply: async () => {
          throw new Error('gemini_down');
        },
      }),
    }));

    const { createGeminiOnlyBrain, AgentLlmUnavailableError } =
      await import('@/agent/create-brain');
    const brain = createGeminiOnlyBrain(() => ctx());

    await expect(
      brain.generateReply({
        conversationId: 'c1',
        employeeId: 'emp_1',
        employeeMessage: 'VPN erro 809',
        recentMessages: [],
      }),
    ).rejects.toBeInstanceOf(AgentLlmUnavailableError);

    vi.doUnmock('@/agent/gemini-brain');
    vi.resetModules();
  });

  it('propaga erro quando Gemini devolve conteúdo vazio', async () => {
    vi.resetModules();
    vi.doMock('@/agent/gemini-brain', () => ({
      createGeminiAgentBrain: () => ({
        generateReply: async () => ({
          content: '   ',
          decision: {
            understoodIntent: 'empty',
            actions: [],
            rationale: '',
            policyHits: [],
            toolCalls: [],
            modelConfidence: null,
            presentedAssurance: 'UNKNOWN' as const,
          },
        }),
      }),
    }));

    const { createGeminiOnlyBrain, AgentLlmUnavailableError } =
      await import('@/agent/create-brain');
    const brain = createGeminiOnlyBrain(() => ctx());

    await expect(
      brain.generateReply({
        conversationId: 'c1',
        employeeId: 'emp_1',
        employeeMessage: 'status do chamado',
        recentMessages: [],
      }),
    ).rejects.toBeInstanceOf(AgentLlmUnavailableError);

    vi.doUnmock('@/agent/gemini-brain');
    vi.resetModules();
  });
});
