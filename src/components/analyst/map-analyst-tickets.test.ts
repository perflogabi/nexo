import { describe, expect, it } from 'vitest';
import { mapTicketsForAnalystPanel } from '@/components/analyst/map-analyst-tickets';

const tickets = [
  {
    id: 't1',
    number: 'INC-0001',
    title: 'VPN erro 809',
    category: 'REDE_VPN',
    priority: 'HIGH',
    status: 'OPEN',
    resolvedAt: null,
    updatedAt: '2026-10-28T12:00:00.000Z',
  },
  {
    id: 't2',
    number: 'INC-0002',
    title: 'Mouse sem clique',
    category: 'HARDWARE',
    priority: 'LOW',
    status: 'RESOLVED',
    resolvedAt: '2026-10-24T12:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 't3',
    number: 'REQ-0001',
    title: 'Acesso Git',
    category: 'ACESSO',
    priority: 'MEDIUM',
    status: 'APPROVED',
    resolvedAt: '2026-10-24T12:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
  },
];

describe('mapTicketsForAnalystPanel', () => {
  it('destaca ticket aberto e conta abertos/encerrados', () => {
    const model = mapTicketsForAnalystPanel({
      employeeName: 'Ana Souza',
      tickets,
      claimed: false,
      conversationStatus: 'WAITING_ANALYST',
      transferSummary: 'VPN 809',
      updatedAt: '2026-10-28T13:05:00.000Z',
    });
    expect(model.firstName).toBe('Ana');
    expect(model.openCount).toBe(1);
    expect(model.closedCount).toBe(2);
    expect(model.current?.number).toBe('INC-0001');
    expect(model.current?.statusTone).toBe('waiting');
    expect(model.others).toHaveLength(2);
  });

  it('no claimed mostra Assumido por você', () => {
    const model = mapTicketsForAnalystPanel({
      employeeName: 'Ana Souza',
      tickets,
      claimed: true,
      conversationStatus: 'WITH_ANALYST',
      transferSummary: null,
    });
    expect(model.current?.eventLabel).toBe('Assumido por você');
    expect(model.current?.eventIcon).toBe('claim');
  });
});
