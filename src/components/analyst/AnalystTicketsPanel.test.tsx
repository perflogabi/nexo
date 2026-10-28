import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';

describe('AnalystTicketsPanel', () => {
  it('mostra desta conversa e outros chamados (aguardando)', () => {
    render(<AnalystTicketsPanel />);
    expect(screen.getByRole('heading', { name: 'Chamados da Ana' })).toBeInTheDocument();
    expect(screen.getByText('Desta conversa')).toBeInTheDocument();
    expect(screen.getByText('INC-20311')).toBeInTheDocument();
    expect(screen.getByText('Aguardando analista')).toBeInTheDocument();
    expect(screen.getByText('Transferido para um analista')).toBeInTheDocument();
    expect(screen.getByText('Outros chamados')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Ver todos os chamados da Ana/ }),
    ).toBeInTheDocument();
  });

  it('no estado assumido mostra Em atendimento e Assumido por', () => {
    render(<AnalystTicketsPanel claimed />);
    expect(screen.getByText('Em atendimento')).toBeInTheDocument();
    expect(screen.getByText('Assumido por Rafael Lima')).toBeInTheDocument();
    expect(screen.getByText('10:12')).toBeInTheDocument();
  });
});
