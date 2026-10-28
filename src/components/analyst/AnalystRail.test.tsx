import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalystRail } from '@/components/analyst/AnalystRail';

describe('AnalystRail', () => {
  it('mostra badge de conversas e avatar do analista', () => {
    render(<AnalystRail badgeCount={5} analystInitials="RL" />);
    expect(screen.getByRole('button', { name: /Conversas/ })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('RL')).toBeInTheDocument();
  });
});
