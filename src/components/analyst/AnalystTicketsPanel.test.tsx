import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';

describe('AnalystTicketsPanel', () => {
  it('mostra desta conversa e outros chamados', () => {
    render(<AnalystTicketsPanel />);
    expect(screen.getByRole('heading', { name: 'Chamados da Ana' })).toBeInTheDocument();
    expect(screen.getByText('Desta conversa')).toBeInTheDocument();
    expect(screen.getByText('INC-20311')).toBeInTheDocument();
    expect(screen.getByText('Outros chamados')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Ver todos os chamados da Ana/ }),
    ).toBeInTheDocument();
  });
});
