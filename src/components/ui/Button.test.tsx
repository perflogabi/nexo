import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza o texto', () => {
    render(<Button>Entrar</Button>);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('dispara onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuar</Button>);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renderiza ícone à esquerda quando informado', () => {
    const { container } = render(
      <Button icon="send" size="md">
        Enviar
      </Button>,
    );
    expect(container.querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('aplica tamanho lg', () => {
    render(
      <Button size="lg" icon="headphones">
        Falar com analista
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Falar com analista' }).className).toContain('h-12');
  });

  it('fica disabled quando solicitado', () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole('button', { name: 'Bloqueado' })).toBeDisabled();
  });

  it('renderiza seta à direita no CTA Entrar', () => {
    const { container } = render(<Button iconEnd="arrow">Entrar</Button>);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
