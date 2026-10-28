import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renderiza label e alterna estado', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Manter conectado neste computador" />);
    const box = screen.getByRole('checkbox', { name: 'Manter conectado neste computador' });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(box).toBeChecked();
  });
});
