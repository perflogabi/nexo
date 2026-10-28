import { describe, expect, it } from 'vitest';
import { mapAnalystApiMessage } from '@/components/analyst/map-analyst-message';

describe('mapAnalystApiMessage', () => {
  it('mapeia EMPLOYEE / AGENT / ANALYST / SYSTEM', () => {
    const at = '2026-10-28T13:05:00.000Z';
    expect(
      mapAnalystApiMessage({
        id: '1',
        authorType: 'EMPLOYEE',
        authorId: 'e',
        content: 'Oi',
        createdAt: at,
      }).kind,
    ).toBe('employee');

    expect(
      mapAnalystApiMessage({
        id: '2',
        authorType: 'AGENT',
        authorId: null,
        content: 'Olá',
        createdAt: at,
      }).kind,
    ).toBe('ia');

    const analyst = mapAnalystApiMessage({
      id: '3',
      authorType: 'ANALYST',
      authorId: 'a',
      content: 'Vou ajudar',
      createdAt: at,
      authorName: 'Carla Analista',
    });
    expect(analyst).toMatchObject({
      kind: 'analyst',
      author: 'Carla Analista',
      team: 'Suporte N2',
    });

    const system = mapAnalystApiMessage({
      id: '4',
      authorType: 'SYSTEM',
      authorId: null,
      content: 'Transferida para Suporte N2',
      createdAt: at,
    });
    expect(system.kind).toBe('system');
    if (system.kind === 'system') {
      expect(system.icon).toBe('transfer');
      expect(system.text).toContain('Transferida');
    }
  });
});
