import { describe, expect, it } from 'vitest';
import {
  pickActiveConversation,
  pickAgentChatConversation,
} from '@/components/chat/employee-chat-api';

describe('pickAgentChatConversation', () => {
  it('escolhe só WITH_AGENT (ignora fila)', () => {
    const picked = pickAgentChatConversation([
      {
        id: 'w',
        status: 'WAITING_ANALYST',
        messageCount: 5,
        updatedAt: '2026-10-28T14:00:00.000Z',
      },
      {
        id: 'a',
        status: 'WITH_AGENT',
        messageCount: 2,
        updatedAt: '2026-10-28T13:00:00.000Z',
      },
    ]);
    expect(picked?.id).toBe('a');
  });

  it('retorna null se não houver WITH_AGENT', () => {
    expect(
      pickAgentChatConversation([
        {
          id: 'w',
          status: 'WAITING_ANALYST',
          messageCount: 1,
          updatedAt: '2026-10-28T13:00:00.000Z',
        },
      ]),
    ).toBeNull();
  });
});

describe('pickActiveConversation', () => {
  it('mantém WITH_ANALYST no reload (não descarta atendimento humano)', () => {
    const picked = pickActiveConversation([
      {
        id: 'human',
        status: 'WITH_ANALYST',
        messageCount: 8,
        updatedAt: '2026-10-29T20:00:00.000Z',
      },
      {
        id: 'closed',
        status: 'CLOSED',
        messageCount: 3,
        updatedAt: '2026-10-28T12:00:00.000Z',
      },
    ]);
    expect(picked?.id).toBe('human');
  });

  it('prefere WITH_AGENT sobre WAITING_ANALYST', () => {
    const picked = pickActiveConversation([
      {
        id: 'a',
        status: 'WITH_AGENT',
        messageCount: 2,
        updatedAt: '2026-10-28T14:00:00.000Z',
      },
      {
        id: 'w',
        status: 'WAITING_ANALYST',
        messageCount: 5,
        updatedAt: '2026-10-28T13:00:00.000Z',
      },
      {
        id: 'c',
        status: 'CLOSED',
        messageCount: 1,
        updatedAt: '2026-10-27T12:00:00.000Z',
      },
    ]);
    expect(picked?.id).toBe('a');
  });

  it('escolhe WITH_AGENT mais recente', () => {
    const picked = pickActiveConversation([
      {
        id: 'old',
        status: 'WITH_AGENT',
        messageCount: 1,
        updatedAt: '2026-10-20T12:00:00.000Z',
      },
      {
        id: 'new',
        status: 'WITH_AGENT',
        messageCount: 2,
        updatedAt: '2026-10-28T12:00:00.000Z',
      },
    ]);
    expect(picked?.id).toBe('new');
  });
});
