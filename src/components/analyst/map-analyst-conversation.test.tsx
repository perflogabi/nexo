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
    expect(item.status).toEqual({
      tone: 'transfer',
      label: 'Transferida · Funcionário pediu analista',
    });
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
          name: 'Bruno Tavares',
          email: 'bruno.tavares@nexo.com.br',
          department: null,
        },
      },
      1,
    );

    expect(item.initials).toBe('BT');
    expect(item.status.tone).toBe('active');
    expect(item.status.label).toBe('Em atendimento');
    expect(item.preview).toContain('Bruno');
  });

  it('mapeia WITH_AGENT e preview do agent', () => {
    const item = mapAnalystConversationToListItem({
      id: 'conv_diego',
      status: 'WITH_AGENT',
      transferSummary: null,
      updatedAt: new Date().toISOString(),
      employee: {
        id: 'emp_diego',
        name: 'Diego Ramos',
        email: 'diego.ramos@nexo.com.br',
        department: 'Comercial',
      },
      lastMessage: {
        content: 'Vou checar a base de ajuda',
        authorType: 'AGENT',
      },
    });
    expect(item.status).toEqual({ tone: 'active', label: 'Agent atendendo' });
    expect(item.conversationStatus).toBe('WITH_AGENT');
    expect(item.preview).toBe('Nexo: Vou checar a base de ajuda');
    expect(item.previewKind).toBe('nexo');
  });
});
