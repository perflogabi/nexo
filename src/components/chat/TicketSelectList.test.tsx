import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEMO_TICKETS } from '@/components/chat/chat-demo-data';
import { TicketSelectList } from '@/components/chat/TicketSelectList';

describe('TicketSelectList', () => {
  it('marca o item selecionado e notifica onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TicketSelectList items={DEMO_TICKETS} value={DEMO_TICKETS[0].id} onChange={onChange} />,
    );

    expect(screen.getByLabelText(/INC-20311/)).toBeChecked();
    await user.click(screen.getByLabelText(/INC-20288/));
    expect(onChange).toHaveBeenCalledWith('inc-20288');
  });
});
