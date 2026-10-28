import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConversationList } from '@/components/analyst/ConversationList';

describe('ConversationList', () => {
  it('renderiza título, Disponível e conversas demo', () => {
    render(<ConversationList />);
    expect(screen.getByRole('heading', { name: 'Conversas' })).toBeInTheDocument();
    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Para você/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('notifica seleção de conversa', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelect = vi.fn();
    render(<ConversationList onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Carla Mendes/ }));
    expect(onSelect).toHaveBeenCalledWith('carla');
  });
});
