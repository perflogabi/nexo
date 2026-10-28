import {
  IconChevronRight,
  IconClose,
  IconExternalLink,
  IconHeadphones,
  IconTransfer,
} from '@/components/ui/icons';
import {
  DEMO_ANALYST_TICKETS,
  type AnalystTicketTone,
} from '@/components/analyst/analyst-demo-data';

const TONE_DOT: Record<AnalystTicketTone, string> = {
  waiting: 'bg-[var(--color-warning)]',
  progress: 'bg-[var(--color-brand-blue)]',
  approved: 'bg-[var(--color-success)]',
  resolved: 'bg-[var(--color-text-muted)]',
};

const STATUS_TEXT: Record<AnalystTicketTone, string> = {
  waiting: 'text-[var(--color-warning-text)]',
  progress: 'text-[var(--color-primary)]',
  approved: 'text-[var(--color-success)]',
  resolved: 'text-[var(--color-text-muted)]',
};

type Props = {
  /** true = card “Em atendimento” / Assumido (tela 5). */
  claimed?: boolean;
  className?: string;
  onClose?: () => void;
};

/**
 * Painel Chamados da {Nome}.
 * Desktop: coluna inline. Mobile/tablet: sheet/drawer via className do console.
 */
export function AnalystTicketsPanel({ claimed = false, className = '', onClose }: Props) {
  const data = DEMO_ANALYST_TICKETS;
  const current = claimed ? data.currentClaimed : data.currentWaiting;
  const EventIcon = current.eventIcon === 'claim' ? IconHeadphones : IconTransfer;
  const layoutClass = className || 'w-[300px] border-l border-[var(--color-border)] xl:w-[320px]';

  return (
    <aside
      className={['font-ui flex h-full min-h-0 shrink-0 flex-col bg-white', layoutClass]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Chamados da ${data.firstName}`}
    >
      <div className="flex justify-center pt-2 md:hidden" aria-hidden>
        <span className="h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
      </div>

      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
            Chamados da {data.firstName}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
            {data.openCount} abertos · {data.closedCount} encerrados
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
          aria-label="Fechar painel de chamados"
        >
          <IconClose className="size-4" />
        </button>
      </header>

      <div className="nexo-scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <p className="text-[12px] font-medium text-[var(--color-text-muted)]">Desta conversa</p>
        <article className="mt-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
              {current.number}
            </span>
            <span
              className={[
                'inline-flex items-center gap-1.5 text-[11.5px] font-medium',
                STATUS_TEXT[current.statusTone],
              ].join(' ')}
            >
              <span
                className={['size-1.5 rounded-full', TONE_DOT[current.statusTone]].join(' ')}
                aria-hidden
              />
              {current.statusLabel}
            </span>
          </div>
          <h3 className="mt-2 text-[13.5px] leading-snug font-semibold text-[var(--color-text)]">
            {current.title}
          </h3>
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{current.meta}</p>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-border)] pt-2.5 text-[11.5px] text-[var(--color-text-muted)]">
            <EventIcon className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{current.eventLabel}</span>
            <span className="shrink-0">{current.eventTime}</span>
          </div>
        </article>

        <p className="mt-4 text-[12px] font-medium text-[var(--color-text-muted)]">
          Outros chamados
        </p>
        <ul className="mt-1 divide-y divide-[var(--color-border)]">
          {data.others.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 py-2.5 text-left hover:bg-[var(--color-bg-subtle)]/60"
              >
                <span
                  className={['size-1.5 shrink-0 rounded-full', TONE_DOT[ticket.tone]].join(' ')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--color-text)]">
                    {ticket.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-[var(--color-text-muted)]">
                    {ticket.meta}
                  </span>
                </span>
                <IconChevronRight className="size-3.5 shrink-0 text-[var(--color-text-muted)]" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className={[
            'flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)]',
            'border border-[var(--color-border)] bg-white text-[13px] font-medium text-[var(--color-text)]',
            'hover:bg-[var(--color-bg-subtle)]',
          ].join(' ')}
        >
          Ver todos os chamados da {data.firstName}
          <IconExternalLink className="size-3.5 text-[var(--color-text-muted)]" />
        </button>
      </div>
    </aside>
  );
}
