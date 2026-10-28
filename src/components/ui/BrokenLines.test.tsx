import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrokenLines } from './BrokenLines';

describe('BrokenLines', () => {
  it('renderiza cada linha com nowrap e quebras entre elas', () => {
    const { container } = render(
      <BrokenLines lines={['Linha um completa', 'Linha dois completa']} />,
    );

    expect(screen.getByText('Linha um completa')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('Linha dois completa')).toHaveClass('whitespace-nowrap');
    expect(container.querySelectorAll('br')).toHaveLength(1);
  });

  it('aceita lastLine sem nowrap obrigatório', () => {
    render(<BrokenLines lines={['Primeira']} lastLine="fim." />);
    expect(screen.getByText('fim.')).toBeInTheDocument();
  });
});
