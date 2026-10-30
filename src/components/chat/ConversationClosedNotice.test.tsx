import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConversationClosedNotice } from '@/components/chat/ConversationClosedNotice';

describe('ConversationClosedNotice', () => {
  it('mostra título, tag Encerrado e copy', () => {
    render(<ConversationClosedNotice />);
    expect(screen.getByText('Atendimento encerrado')).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    expect(
      screen.getByText(
        /O atendimento foi finalizado pelo analista\. Esta conversa não está mais em atendimento\./,
      ),
    ).toBeInTheDocument();
  });
});
