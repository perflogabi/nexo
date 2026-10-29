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

describe('createGeminiWithMockFallbackBrain', () => {
  it('usa mock quando Gemini lança erro', async () => {
    vi.resetModules();
    vi.doMock('@/agent/gemini-brain', () => ({
      createGeminiAgentBrain: () => ({
        generateReply: async () => {
          throw new Error('gemini_down');
        },
      }),
    }));

    const { createGeminiWithMockFallbackBrain } = await import('@/agent/create-brain');
    const reasons: string[] = [];
    const brain = createGeminiWithMockFallbackBrain(() => ctx(), {
      onFallback: (r) => reasons.push(r),
    });

    const draft = await brain.generateReply({
      conversationId: 'c1',
      employeeId: 'emp_1',
      employeeMessage: 'VPN erro 809',
      recentMessages: [],
    });

    expect(draft.content.length).toBeGreaterThan(0);
    expect(reasons.some((r) => r.includes('gemini_down'))).toBe(true);
    vi.doUnmock('@/agent/gemini-brain');
    vi.resetModules();
  });

  it('usa mock quando Gemini devolve conteúdo vazio', async () => {
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

    const { createGeminiWithMockFallbackBrain } = await import('@/agent/create-brain');
    const reasons: string[] = [];
    const brain = createGeminiWithMockFallbackBrain(() => ctx(), {
      onFallback: (r) => reasons.push(r),
    });

    const draft = await brain.generateReply({
      conversationId: 'c1',
      employeeId: 'emp_1',
      employeeMessage: 'status do chamado',
      recentMessages: [],
    });

    expect(draft.content.trim().length).toBeGreaterThan(0);
    expect(reasons).toContain('empty_reply');
    vi.doUnmock('@/agent/gemini-brain');
    vi.resetModules();
  });
});
