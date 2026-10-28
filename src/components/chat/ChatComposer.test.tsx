import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatComposer } from '@/components/chat/ChatComposer';

describe('ChatComposer', () => {
  it('mostra contador e envia texto', async () => {
    const user = userEvent.setup({ delay: null });
    const onSend = vi.fn();
    render(<ChatComposer messageCount={16} onSend={onSend} />);

    expect(screen.getByText('16/30 mensagens nesta sessão')).toBeInTheDocument();
    const input = screen.getByLabelText('Mensagem');
    await user.type(input, 'Olá Nexo');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onSend).toHaveBeenCalledWith('Olá Nexo');
  }, 15_000);
});
