import { describe, expect, it } from 'vitest';
import {
  filterEmployeeVisibleMessages,
  isAnalystOnlySystemMessage,
} from '@/lib/employee-visible-messages';

describe('employee-visible-messages', () => {
  it('oculta Assumido por você (texto legado e payload)', () => {
    expect(
      isAnalystOnlySystemMessage({
        authorType: 'SYSTEM',
        content: 'Assumido por você · 21:10',
      }),
    ).toBe(true);
    expect(
      isAnalystOnlySystemMessage({
        authorType: 'SYSTEM',
        content: 'x',
        structuredPayload: { type: 'analyst_claim' },
      }),
    ).toBe(true);
  });

  it('mantém Transferida para Suporte N2 e falas do analista', () => {
    const kept = filterEmployeeVisibleMessages([
      { authorType: 'SYSTEM', content: 'Transferida para Suporte N2' },
      { authorType: 'SYSTEM', content: 'Assumido por você · 10:00' },
      { authorType: 'ANALYST', content: 'Oi, Fabio' },
    ]);
    expect(kept).toHaveLength(2);
    expect(kept[0]?.content).toContain('Transferida');
    expect(kept[1]?.authorType).toBe('ANALYST');
  });
});
