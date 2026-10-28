import { describe, expect, it } from 'vitest';
import { pickActiveConversation } from '@/components/chat/employee-chat-api';

describe('pickActiveConversation', () => {
  it('prefere WAITING_ANALYST sobre WITH_AGENT', () => {
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
    expect(picked?.id).toBe('w');
  });

  it('escolhe WITH_AGENT mais recente se não houver fila', () => {
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
