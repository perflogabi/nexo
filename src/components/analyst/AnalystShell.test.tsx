import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnalystShell } from '@/components/analyst/AnalystShell';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe('AnalystShell', () => {
  it('no mobile com pane=chat, lista fica hidden e chat visível', () => {
    render(
      <AnalystShell mobilePane="chat">
        <div>área do chat</div>
      </AnalystShell>,
    );

    const list = screen.getByLabelText('Lista de conversas');
    expect(list.className).toMatch(/\bhidden\b/);
    expect(list.className).toMatch(/\bmd:flex\b/);
    expect(screen.getByText('área do chat')).toBeInTheDocument();
  });

  it('no mobile com pane=list, área do chat fica hidden', () => {
    render(
      <AnalystShell mobilePane="list">
        <div data-testid="chat-area">área do chat</div>
      </AnalystShell>,
    );

    const chatWrap = screen.getByTestId('chat-area').parentElement;
    expect(chatWrap?.className).toMatch(/\bhidden\b/);
    expect(chatWrap?.className).toMatch(/\bmd:flex\b/);
    expect(screen.getByLabelText('Lista de conversas').className).toMatch(/\bflex\b/);
  });
});
