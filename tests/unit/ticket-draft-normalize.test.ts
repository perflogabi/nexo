import { describe, expect, it } from 'vitest';
import {
  normalizeCategory,
  normalizePriority,
  normalizeTicketDraftFields,
  normalizeTicketType,
} from '@/domain/ticket-draft-normalize';

describe('normalizeTicketType', () => {
  it('maps INCIDENT / incidente → INC', () => {
    expect(normalizeTicketType('INCIDENT')).toBe('INC');
    expect(normalizeTicketType('Incidente')).toBe('INC');
    expect(normalizeTicketType('INC')).toBe('INC');
  });

  it('maps request variants → REQ', () => {
    expect(normalizeTicketType('REQUEST')).toBe('REQ');
    expect(normalizeTicketType('Requisição')).toBe('REQ');
    expect(normalizeTicketType('REQ')).toBe('REQ');
  });
});

describe('normalizeCategory', () => {
  it('maps free-text VPN/rede → REDE_VPN', () => {
    expect(normalizeCategory('Rede e Conectividade')).toBe('REDE_VPN');
    expect(normalizeCategory('VPN')).toBe('REDE_VPN');
    expect(normalizeCategory('REDE_VPN')).toBe('REDE_VPN');
  });

  it('falls back to OUTROS', () => {
    expect(normalizeCategory('Facilities')).toBe('OUTROS');
  });
});

describe('normalizePriority', () => {
  it('maps pt labels', () => {
    expect(normalizePriority('Média')).toBe('MEDIUM');
    expect(normalizePriority('Alta')).toBe('HIGH');
    expect(normalizePriority('Crítica')).toBe('CRITICAL');
  });
});

describe('normalizeTicketDraftFields', () => {
  it('normalizes Gemini-like draft that broke confirm', () => {
    expect(
      normalizeTicketDraftFields({
        type: 'INCIDENT',
        category: 'Rede e Conectividade',
        priority: 'Média',
      }),
    ).toEqual({
      type: 'INC',
      category: 'REDE_VPN',
      priority: 'MEDIUM',
    });
  });
});
