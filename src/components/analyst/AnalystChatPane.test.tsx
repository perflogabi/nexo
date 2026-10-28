import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalystChatPane } from '@/components/analyst/AnalystChatPane';

describe('AnalystChatPane', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra header, transcript e ações de assumir', () => {
    render(<AnalystChatPane />);
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Aguardando atendente')).toBeInTheDocument();
    expect(screen.getByText(/Qual o status do meu chamado/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Assuma o atendimento para responder')).toBeDisabled();
  });

  it('chama onClaim ao Assumir atendimento', async () => {
    const user = userEvent.setup({ delay: null });
    const onClaim = vi.fn();
    render(<AnalystChatPane onClaim={onClaim} />);
    await user.click(screen.getByRole('button', { name: 'Assumir atendimento' }));
    expect(onClaim).toHaveBeenCalled();
  });

  it('volta às conversas e abre chamados quando callbacks existem', async () => {
    const user = userEvent.setup({ delay: null });
    const onBack = vi.fn();
    const onOpenTickets = vi.fn();
    render(<AnalystChatPane onBack={onBack} onOpenTickets={onOpenTickets} ticketsOpen={false} />);

    await user.click(screen.getByRole('button', { name: 'Voltar às conversas' }));
    expect(onBack).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Ver chamados' }));
    expect(onOpenTickets).toHaveBeenCalled();
  });

  it('no estado assumido mostra bolhas do analista, composer e Encerrar', () => {
    render(<AnalystChatPane claimed />);
    expect(screen.getByText('Rafael Lima')).toBeInTheDocument();
    expect(screen.getByText('Suporte N2')).toBeInTheDocument();
    expect(screen.getByText(/Rafael Lima assumiu/)).toBeInTheDocument();
    expect(screen.getByText(/Posso sim, está ligado/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Ótimo! Vou iniciar o acesso remoto/)).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Encerrar atendimento' })).toBeInTheDocument();
  });

  it('mostra seta para baixo quando há mensagens fora da viewport e rola ao clicar', async () => {
    const user = userEvent.setup({ delay: null });
    const scrollTo = vi.fn();

    render(<AnalystChatPane />);

    const region = screen.getByLabelText('Chat do atendimento');
    const scroller = region.querySelector('.overflow-y-auto');
    expect(scroller).toBeTruthy();
    if (!(scroller instanceof HTMLElement)) throw new Error('scroller missing');

    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 800 });
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 0 });
    scroller.scrollTo = scrollTo;

    scroller.dispatchEvent(new Event('scroll'));

    const jump = await screen.findByRole('button', { name: 'Ver mensagens mais abaixo' });
    await user.click(jump);

    expect(scrollTo).toHaveBeenCalledWith({ top: 800, behavior: 'smooth' });

    Object.defineProperty(scroller, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 600,
    });
    scroller.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Ver mensagens mais abaixo' })).toBeNull();
    });
  });
});
