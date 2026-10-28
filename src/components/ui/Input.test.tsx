import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';
import { IconMail } from './icons';

describe('Input', () => {
  it('associa label ao campo', () => {
    render(<Input label="E-mail corporativo" leadingIcon={<IconMail />} />);
    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument();
  });

  it('aceita digitação', async () => {
    const user = userEvent.setup();
    render(<Input label="E-mail corporativo" />);
    const field = screen.getByLabelText('E-mail corporativo');
    await user.type(field, 'ana@nexo.local');
    expect(field).toHaveValue('ana@nexo.local');
  });

  it('mostra ação da label e erro', () => {
    render(
      <Input
        label="Senha"
        labelAction={<button type="button">Esqueci minha senha</button>}
        error="Senha obrigatória"
      />,
    );
    expect(screen.getByRole('button', { name: 'Esqueci minha senha' })).toBeInTheDocument();
    expect(screen.getByText('Senha obrigatória')).toBeInTheDocument();
  });
});
