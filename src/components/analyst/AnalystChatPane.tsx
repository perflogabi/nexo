'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  IconBot,
  IconChevronDown,
  IconChevronLeft,
  IconDoubleCheck,
  IconHand,
  IconHeadphones,
  IconMoreVertical,
  IconPaperPlane,
  IconSearch,
  IconShieldCheck,
  IconTicket,
  IconTransfer,
} from '@/components/ui/icons';
import { DEMO_ANALYST_CHAT, type AnalystChatMessage } from '@/components/analyst/analyst-demo-data';

export type AnalystChatEmployeeHeader = {
  name: string;
  initials: string;
  metaWaiting: string;
  metaClaimed: string;
  firstName: string;
};

type Props = {
  claimed?: boolean;
  /** Desabilita Assumir/Devolver/Encerrar durante request. */
  busy?: boolean;
  /** Transcript vivo; `[]` = live vazio. `undefined` = demo. */
  messages?: AnalystChatMessage[];
  /** Header vivo; `null` = live carregando (não usa demo). `undefined` = demo. */
  employee?: AnalystChatEmployeeHeader | null;
  waitingUntil?: string;
  draftMessage?: string;
  onSend?: (text: string) => void | Promise<void>;
  onClaim?: () => void;
  onReturn?: () => void;
  onClose?: () => void;
  /** Voltar à lista — só exibido em &lt; md (master-detail). */
  onBack?: () => void;
  onOpenTickets?: () => void;
  ticketsOpen?: boolean;
  className?: string;
};

/** Distância do fundo (px) abaixo da qual consideramos “no final”. */
const BOTTOM_THRESHOLD_PX = 28;

function MessageBubble({ message }: { message: AnalystChatMessage }) {
  if (message.kind === 'system') {
    const SystemIcon = message.icon === 'claim' ? IconHeadphones : IconTransfer;
    return (
      <div className="flex items-center gap-3 py-2" role="status">
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
        <p className="font-ui inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
          <SystemIcon className="size-3.5" />
          {message.text}
        </p>
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
      </div>
    );
  }

  if (message.kind === 'employee') {
    return (
      <div className="flex justify-start">
        <div className="inline-flex max-w-[min(100%,78%)] items-end gap-2.5 rounded-[18px] rounded-bl-[6px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 shadow-[0_1px_0_rgba(27,36,48,0.04)]">
          <p className="min-w-0 text-[13.5px] leading-snug text-[var(--color-text)]">
            {message.text}
          </p>
          <time
            className="mb-px shrink-0 text-[11px] leading-none text-[var(--color-text-muted)]"
            dateTime={message.time}
          >
            {message.time}
          </time>
        </div>
      </div>
    );
  }

  if (message.kind === 'analyst') {
    return (
      <div className="ml-auto flex w-fit max-w-[min(100%,78%)] flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 pr-0.5">
          <span className="text-[12.5px] font-semibold text-[var(--color-text)]">
            {message.author}
          </span>
          <span className="rounded-[3px] bg-[var(--color-analyst-badge)] px-1.5 py-px text-[9px] font-bold tracking-wide text-white">
            {message.team}
          </span>
        </div>
        <div className="w-fit max-w-full rounded-[18px] rounded-br-[6px] bg-[var(--color-bg-analyst-bubble)] px-3.5 py-2.5">
          <p className="text-[13.5px] leading-snug text-[var(--color-text)]">{message.text}</p>
          <div className="mt-1.5 flex items-center justify-end gap-1">
            <time
              className="text-[11px] leading-none text-[var(--color-text-muted)]"
              dateTime={message.time}
            >
              {message.time}
            </time>
            <IconDoubleCheck className="size-3.5 text-[var(--color-brand-blue)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-auto flex w-fit max-w-[min(100%,78%)] flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 pr-0.5">
        <span className="text-[12.5px] font-semibold text-[var(--color-text)]">Nexo Assist</span>
        <span className="rounded-[3px] bg-[var(--color-primary)] px-1 py-px text-[9px] font-bold tracking-wide text-white">
          IA
        </span>
      </div>
      <div className="w-fit max-w-full rounded-[18px] rounded-br-[6px] bg-[var(--color-bg-ia-bubble)] px-3.5 py-2.5">
        <p className="text-[13.5px] leading-snug text-[var(--color-text)]">{message.text}</p>
        <div className="mt-1.5 flex items-center justify-end gap-1">
          <time
            className="text-[11px] leading-none text-[var(--color-text-muted)]"
            dateTime={message.time}
          >
            {message.time}
          </time>
          <IconDoubleCheck className="size-3.5 text-[var(--color-brand-blue)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Coluna central do console.
 * Aguardando: badge + barra Assumir + composer locked.
 * Assumido: Devolver/Encerrar no header, bolhas do analista, composer + enviar.
 */
export function AnalystChatPane({
  claimed = false,
  busy = false,
  messages: messagesProp,
  employee: employeeProp,
  waitingUntil: waitingUntilProp,
  draftMessage: draftMessageProp,
  onSend,
  onClaim,
  onReturn,
  onClose,
  onBack,
  onOpenTickets,
  ticketsOpen = false,
  className = '',
}: Props) {
  const employee =
    employeeProp === undefined
      ? DEMO_ANALYST_CHAT.employee
      : (employeeProp ?? {
          name: '…',
          initials: '…',
          firstName: '…',
          metaWaiting: '…',
          metaClaimed: '…',
        });
  const waitingUntil = waitingUntilProp ?? (messagesProp ? '—' : DEMO_ANALYST_CHAT.waitingUntil);
  const draftMessage = draftMessageProp ?? (messagesProp ? '' : DEMO_ANALYST_CHAT.draftMessage);
  const messages =
    messagesProp ??
    (claimed
      ? (DEMO_ANALYST_CHAT.messagesClaimed ?? DEMO_ANALYST_CHAT.messagesWaiting)
      : DEMO_ANALYST_CHAT.messagesWaiting);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [draft, setDraft] = useState<string>(draftMessage);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setDraft(draftMessage);
  }, [draftMessage]);

  const updateMoreBelow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setHasMoreBelow(distance > BOTTOM_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateMoreBelow();
    el.addEventListener('scroll', updateMoreBelow, { passive: true });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMoreBelow) : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener('scroll', updateMoreBelow);
      ro?.disconnect();
    };
  }, [updateMoreBelow, messages]);

  useEffect(() => {
    if (!claimed) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    updateMoreBelow();
  }, [claimed, messages, updateMoreBelow]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy || sending) return;
    if (!onSend) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className={[
        'font-ui flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-bg-chat-console)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Chat do atendimento"
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-white px-3 sm:gap-3 sm:px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] md:hidden"
            aria-label="Voltar às conversas"
          >
            <IconChevronLeft className="size-5" />
          </button>
        ) : null}

        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DCEBFA] text-[12px] font-semibold text-[#1D4F91]">
          {employee.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[var(--color-text)]">
            {employee.name}
          </p>
          <p className="truncate text-[12px] text-[var(--color-text-muted)]">
            {claimed ? employee.metaClaimed : employee.metaWaiting}
          </p>
        </div>

        {!claimed ? (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-[#F8F1DE] px-2.5 py-1 text-[12px] font-medium text-[var(--color-warning-text)] sm:inline-flex">
            <IconBot className="size-3.5" />
            <span className="hidden lg:inline">Aguardando atendente</span>
            <span className="lg:hidden">Aguardando</span>
          </span>
        ) : (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-auto px-3"
              disabled={busy}
              onClick={onReturn}
            >
              <span className="inline-flex items-center gap-1.5">
                <IconBot className="size-3.5" />
                Devolver ao agent
              </span>
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className={[
                'font-ui inline-flex h-9 w-auto items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3',
                'border border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[13px] font-semibold text-[var(--color-danger)]',
                'hover:bg-[#f3d5d9] disabled:cursor-not-allowed disabled:opacity-60',
              ].join(' ')}
            >
              <IconShieldCheck className="size-4" />
              Encerrar atendimento
            </button>
          </div>
        )}

        {onOpenTickets && !ticketsOpen ? (
          <button
            type="button"
            onClick={onOpenTickets}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
            aria-label="Ver chamados"
          >
            <IconTicket className="size-4" />
          </button>
        ) : null}

        {!claimed ? (
          <button
            type="button"
            className="hidden rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] sm:inline-flex"
            aria-label="Buscar na conversa"
          >
            <IconSearch className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
          aria-label="Mais opções"
        >
          <IconMoreVertical className="size-4" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className={[
            'h-full space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          ].join(' ')}
        >
          <div className="flex justify-center pb-1">
            <span className="rounded-[var(--radius-pill)] bg-white/80 px-3 py-0.5 text-[11.5px] font-medium text-[var(--color-text-muted)] shadow-[0_1px_0_rgba(27,36,48,0.04)]">
              Hoje
            </span>
          </div>
          {(messages ?? []).map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {hasMoreBelow ? (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Ver mensagens mais abaixo"
            className={[
              'absolute bottom-3 left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center',
              'rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-muted)]',
              'shadow-[0_2px_8px_rgba(27,36,48,0.12)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
            ].join(' ')}
          >
            <IconChevronDown className="size-4" />
          </button>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-[var(--color-border)] bg-white">
        {!claimed ? (
          <div className="flex flex-col gap-3 px-3 pt-3 pb-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F8F1DE] text-[var(--color-warning-text)]">
                <IconHand className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--color-text)]">
                  {employee.firstName} espera um atendente
                </p>
                <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                  Agent pausado · até {waitingUntil}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:shrink-0 sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full px-3 sm:w-auto"
                disabled={busy}
                onClick={onReturn}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <IconBot className="size-3.5" />
                  Devolver ao agent
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                icon="headphones"
                className="w-full px-3 sm:w-auto"
                disabled={busy}
                onClick={onClaim}
              >
                Assumir atendimento
              </Button>
            </div>
          </div>
        ) : (
          /* ações compactas no mobile (header esconde Devolver/Encerrar em &lt; sm) */
          <div className="flex gap-2 px-3 pt-3 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-w-0 flex-1 px-2"
              disabled={busy}
              onClick={onReturn}
            >
              Devolver
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className={[
                'font-ui inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2',
                'border border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[13px] font-semibold text-[var(--color-danger)]',
                'hover:bg-[#f3d5d9] disabled:cursor-not-allowed disabled:opacity-60',
              ].join(' ')}
            >
              <IconShieldCheck className="size-3.5" />
              Encerrar
            </button>
          </div>
        )}

        <div className={['px-3 pb-3 sm:px-4', claimed ? 'pt-3' : 'pt-0.5'].join(' ')}>
          {claimed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 min-w-0 flex-1 items-center rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] px-4">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Escreva uma mensagem..."
                  aria-label="Mensagem do analista"
                  className="min-w-0 flex-1 bg-transparent text-left text-[13.5px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>
              <button
                type="button"
                aria-label="Enviar mensagem"
                disabled={!draft.trim() || busy || sending}
                onClick={() => void handleSend()}
                className={[
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  'bg-[var(--color-primary)] text-white shadow-[0_1px_3px_rgba(0,98,196,0.35)]',
                  'transition-colors hover:bg-[var(--color-primary-hover)]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
                ].join(' ')}
              >
                <IconPaperPlane className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-4">
              <input
                type="text"
                disabled
                placeholder="Assuma o atendimento para responder"
                aria-label="Mensagem do analista"
                className="min-w-0 flex-1 bg-transparent text-left text-[13.5px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </footer>
    </section>
  );
}
