import { describe, expect, it } from 'vitest';
import { isAddInfoRequest, isPoliteDismiss } from '@/agent/chat-followups';
import { resolveTicketForDetail } from '@/agent/ticket-ui-resolution';
import type { TicketRecord } from '@/services/tickets/types';

const NOW = new Date('2026-10-29T12:00:00.000Z');
const carla = [
  {
    id: '1',
    number: 'REQ-0200',
    type: 'REQ',
    title: 'Acesso ao SAP',
    description: 'd',
    category: 'ACESSO',
    priority: 'HIGH',
    status: 'OPEN',
    ownerEmployeeId: 'e',
    affectedEmployeeId: 'e',
    slaDeadlineAt: NOW,
    resolvedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  } satisfies TicketRecord,
];

describe('chat followups', () => {
  it('detecta Não, obrigado', () => {
    expect(isPoliteDismiss('Não, obrigado')).toBe(true);
    expect(isPoliteDismiss('nao precisa')).toBe(true);
    expect(isAddInfoRequest('Adicionar informação')).toBe(true);
  });

  it('não reabre detalhe em dismiss; sap e acesso abrem', () => {
    expect(resolveTicketForDetail(carla, 'Não, obrigado')).toBeNull();
    expect(resolveTicketForDetail(carla, 'sap')?.number).toBe('REQ-0200');
    expect(resolveTicketForDetail(carla, 'quero saber so acesso')?.number).toBe('REQ-0200');
  });
});
