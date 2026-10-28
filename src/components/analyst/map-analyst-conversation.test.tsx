import { describe, expect, it } from 'vitest';
import { mapAnalystConversationToListItem } from '@/components/analyst/map-analyst-conversation';

describe('mapAnalystConversationToListItem', () => {
  it('mapeia WAITING_ANALYST para tom transfer', () => {
    const item = mapAnalystConversationToListItem({
      id: 'conv_ana_waiting',
      status: 'WAITING_ANALYST',
      transferSummary: 'Funcionário pediu analista',
      updatedAt: '2026-10-28T13:05:00.000Z',
      employee: {
        id: 'emp_ana',
        name: 'Ana Souza',
        email: 'ana.souza@nexo.com.br',
        department: 'Financeiro',
      },
    });

    expect(item.id).toBe('conv_ana_waiting');
    expect(item.name).toBe('Ana Souza');
    expect(item.initials).toBe('AS');
    expect(item.preview).toBe('Funcionário pediu analista');
    expect(item.status).toEqual({ tone: 'transfer', label: 'Transferida · aguardando' });
    expect(item.timeEmphasis).toBe(true);
  });

  it('mapeia WITH_ANALYST para tom active', () => {
    const item = mapAnalystConversationToListItem(
      {
        id: 'conv_1',
        status: 'WITH_ANALYST',
        transferSummary: null,
        updatedAt: new Date('2026-10-28T14:00:00.000Z'),
        employee: {
          id: 'emp_x',
          name: 'Bruno Lima',
          email: 'bruno@nexo.local',
          department: null,
        },
      },
      1,
    );

    expect(item.initials).toBe('BL');
    expect(item.status.tone).toBe('active');
    expect(item.preview).toContain('Bruno');
  });
});
