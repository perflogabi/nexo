import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renderiza tipografia Entrar e campos sem demo pré-preenchida', () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText(/Demo:/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail corporativo')).toHaveValue('');
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('chama onSubmit com e-mail e senha', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('E-mail corporativo'), 'ana@nexo.local');
    await user.type(screen.getByLabelText('Senha'), 'qualquer');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@nexo.local',
        password: 'qualquer',
        keepSignedIn: true,
      }),
    );
  }, 15_000);
});
