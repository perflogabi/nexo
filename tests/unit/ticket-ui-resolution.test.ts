import { describe, expect, it } from 'vitest';
import {
  resolveTicketForDetail,
  shouldShowDetailInsteadOfList,
} from '@/agent/ticket-ui-resolution';
import type { TicketRecord } from '@/services/tickets/types';

const NOW = new Date('2026-10-29T12:00:00.000Z');

function ticket(
  partial: Partial<TicketRecord> & Pick<TicketRecord, 'id' | 'number' | 'title'>,
): TicketRecord {
  return {
    type: 'REQ',
    description: 'd',
    category: 'ACESSO',
    priority: 'HIGH',
    status: 'OPEN',
    ownerEmployeeId: 'emp',
    affectedEmployeeId: 'emp',
    slaDeadlineAt: NOW,
    resolvedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe('ticket-ui-resolution', () => {
  const carlaOnly = [ticket({ id: '1', number: 'REQ-0200', title: 'Acesso ao SAP' })];

  it('com 1 chamado aberto, listagem preferência detalhe; status não resolve por hint fraco', () => {
    expect(shouldShowDetailInsteadOfList(carlaOnly)?.number).toBe('REQ-0200');
    // Status sem número/título: list path usa shouldShowDetailInsteadOfList, não resolveTicketForDetail.
    expect(resolveTicketForDetail(carlaOnly, 'Qual o status do meu chamado?')).toBeNull();
  });

  it('casa “sap” com Acesso ao SAP', () => {
    expect(resolveTicketForDetail(carlaOnly, 'sap')?.number).toBe('REQ-0200');
  });

  it('casa número explícito', () => {
    const many = [
      ...carlaOnly,
      ticket({ id: '2', number: 'INC-0001', title: 'VPN erro 809', type: 'INC' }),
    ];
    expect(resolveTicketForDetail(many, 'REQ-0200 · Acesso ao SAP')?.number).toBe('REQ-0200');
  });
});
