import { describe, expect, it } from 'vitest';
import { dedupeAnalystConversationsByEmployee } from '@/lib/dedupe-analyst-conversations';

describe('dedupeAnalystConversationsByEmployee', () => {
  it('uma entrada por pessoa — fila ganha da sessão /chat', () => {
    const result = dedupeAnalystConversationsByEmployee([
      {
        id: 'wait',
        status: 'WAITING_ANALYST',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-28T23:01:00.000Z',
      },
      {
        id: 'agent',
        status: 'WITH_AGENT',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-28T23:32:00.000Z',
      },
      {
        id: 'carla',
        status: 'WAITING_ANALYST',
        employee: { id: 'emp_carla' },
        updatedAt: '2026-10-28T13:00:00.000Z',
      },
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.employee.id === 'emp_ana')?.id).toBe('wait');
    expect(result.find((c) => c.employee.id === 'emp_carla')?.id).toBe('carla');
  });

  it('dentro do mesmo status fica a mais recente', () => {
    const result = dedupeAnalystConversationsByEmployee([
      {
        id: 'old',
        status: 'WITH_AGENT',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-28T22:00:00.000Z',
      },
      {
        id: 'new',
        status: 'WITH_AGENT',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-28T23:32:00.000Z',
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('new');
  });

  it('WITH_ANALYST prevalece sobre WAITING da mesma pessoa', () => {
    const result = dedupeAnalystConversationsByEmployee([
      {
        id: 'wait',
        status: 'WAITING_ANALYST',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-29T01:00:00.000Z',
      },
      {
        id: 'mine',
        status: 'WITH_ANALYST',
        employee: { id: 'emp_ana' },
        updatedAt: '2026-10-29T00:00:00.000Z',
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('mine');
  });
});
