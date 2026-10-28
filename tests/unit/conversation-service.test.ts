import { describe, expect, it } from 'vitest';
import {
  AgentPausedError,
  ConversationAccessDeniedError,
  MessageLimitExceededError,
} from '@/domain/errors';
import {
  createConversationService,
  createInMemoryConversationStore,
} from '@/services/conversations';

describe('ConversationService', () => {
  const NOW = new Date('2026-08-01T12:00:00.000Z');

  function build() {
    let n = 0;
    const store = createInMemoryConversationStore();
    const service = createConversationService({
      store,
      now: () => NOW,
      createId: () => `id-${++n}`,
    });
    return { service, store };
  }

  it('scopes conversations to owner', async () => {
    const { service } = build();
    const conv = await service.createConversation('emp-a');
    await expect(service.getConversation(conv.id, 'emp-b')).rejects.toBeInstanceOf(
      ConversationAccessDeniedError,
    );
  });

  it('increments messageCount only for EMPLOYEE/AGENT up to 30', async () => {
    const { service } = build();
    const conv = await service.createConversation('emp-a');

    for (let i = 0; i < 30; i += 1) {
      const authorType = i % 2 === 0 ? 'EMPLOYEE' : 'AGENT';
      await service.appendMessage({
        conversationId: conv.id,
        sessionEmployeeId: 'emp-a',
        authorType,
        authorId: authorType === 'EMPLOYEE' ? 'emp-a' : null,
        content: `msg ${i}`,
        decisionTrace:
          authorType === 'AGENT'
            ? {
                understoodIntent: 'test',
                actions: [],
                rationale: 'r',
                policyHits: [],
                toolCalls: [],
              }
            : undefined,
      });
    }

    const after = await service.getConversation(conv.id, 'emp-a');
    expect(after.messageCount).toBe(30);

    await expect(
      service.appendMessage({
        conversationId: conv.id,
        sessionEmployeeId: 'emp-a',
        authorType: 'EMPLOYEE',
        authorId: 'emp-a',
        content: 'overflow',
      }),
    ).rejects.toBeInstanceOf(MessageLimitExceededError);

    // ANALYST/SYSTEM do not consume quota — but first need room; use fresh conv
    const conv2 = await service.createConversation('emp-a');
    await service.appendMessage({
      conversationId: conv2.id,
      sessionEmployeeId: 'emp-a',
      authorType: 'SYSTEM',
      authorId: null,
      content: 'transferida',
    });
    const c2 = await service.getConversation(conv2.id, 'emp-a');
    expect(c2.messageCount).toBe(0);
  });

  it('blocks AGENT messages when paused', async () => {
    const { service, store } = build();
    const conv = await service.createConversation('emp-a');
    await store.updateConversationStatus({
      id: conv.id,
      status: 'WAITING_ANALYST',
      transferSummary: 'resumo',
      transferReasonCode: 'USER_REQUEST',
      assignedAnalystId: null,
      updatedAt: NOW,
    });

    await expect(
      service.appendMessage({
        conversationId: conv.id,
        sessionEmployeeId: 'emp-a',
        authorType: 'AGENT',
        authorId: null,
        content: 'não deveria',
      }),
    ).rejects.toBeInstanceOf(AgentPausedError);

    // Employee still can message (human handoff)
    const result = await service.appendMessage({
      conversationId: conv.id,
      sessionEmployeeId: 'emp-a',
      authorType: 'EMPLOYEE',
      authorId: 'emp-a',
      content: 'oi analista',
    });
    expect(result.conversation.messageCount).toBe(1);
  });
});
