import { CHAT_AGENT_SURFACE } from '@/components/chat/chat-layout';
import {
  ticketStatusDotClass,
  ticketStatusTextClass,
  type TicketStatus,
} from '@/components/chat/ticket-status';

export type TicketDetailMeta = {
  category: string;
  priority: string;
  openedAt: string;
  lastUpdateHighlight: string;
  lastUpdateRest: string;
};

type Props = {
  number: string;
  status: TicketStatus;
  title: string;
  description: string;
  meta: TicketDetailMeta;
  className?: string;
};

/** Card de chamado — compacto &lt;2xl; folgado em telas maiores. */
export function TicketDetailCard({
  number,
  status,
  title,
  description,
  meta,
  className = '',
}: Props) {
  return (
    <article
      className={['font-ui px-3.5 py-2.5 2xl:px-5 2xl:py-3.5', CHAT_AGENT_SURFACE, className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] text-[var(--color-text-muted)] 2xl:text-[12.5px]">
          Chamado <span aria-hidden>·</span> {number}
        </p>
        <p
          className={[
            'inline-flex items-center gap-1.5 text-[11.5px] font-medium 2xl:text-[12.5px]',
            ticketStatusTextClass(status.tone),
          ].join(' ')}
        >
          <span
            className={['size-1.5 rounded-full', ticketStatusDotClass(status.tone)].join(' ')}
            aria-hidden
          />
          {status.label}
        </p>
      </header>

      <h2 className="mt-1.5 text-[14px] leading-snug font-semibold text-[var(--color-text)] 2xl:mt-2.5 2xl:text-[16px]">
        {title}
      </h2>
      <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-text-muted)] 2xl:mt-1.5 2xl:text-[13.5px] 2xl:leading-relaxed">
        {description}
      </p>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[var(--color-border)] pt-2.5 xl:grid-cols-4 2xl:mt-3.5 2xl:gap-x-4 2xl:gap-y-3 2xl:pt-3.5">
        <div>
          <dt className="text-[11px] text-[var(--color-text-muted)] 2xl:text-[11.5px]">
            Categoria
          </dt>
          <dd className="mt-0.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            {meta.category}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--color-text-muted)] 2xl:text-[11.5px]">
            Prioridade
          </dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            <span className="size-1.5 rounded-full bg-[var(--color-text-muted)]" aria-hidden />
            {meta.priority}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--color-text-muted)] 2xl:text-[11.5px]">
            Aberto em
          </dt>
          <dd className="mt-0.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            {meta.openedAt}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--color-text-muted)] 2xl:text-[11.5px]">
            Última atualização
          </dt>
          <dd className="mt-0.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            <span className="text-[var(--color-warning-text)]">{meta.lastUpdateHighlight}</span>
            {meta.lastUpdateRest}
          </dd>
        </div>
      </dl>
    </article>
  );
}
