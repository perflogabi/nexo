import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalystRail } from '@/components/analyst/AnalystRail';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe('AnalystRail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it('mostra badge de conversas, avatar e Sair', () => {
    render(<AnalystRail badgeCount={5} analystInitials="RL" />);
    expect(screen.getByRole('button', { name: /Conversas/ })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('RL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('chama logout e redireciona para login', async () => {
    const user = userEvent.setup({ delay: null });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<AnalystRail analystInitials="RL" />);
    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(replace).toHaveBeenCalledWith('/login');
    expect(refresh).toHaveBeenCalled();
  });
});
