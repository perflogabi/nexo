'use client';

import { CHAT_AGENT_SURFACE } from '@/components/chat/chat-layout';
import {
  ticketStatusDotClass,
  ticketStatusTextClass,
  type TicketStatus,
} from '@/components/chat/ticket-status';
import { Button } from '@/components/ui/Button';

export type TicketDraftMeta = {
  type: string;
  category: string;
  priority: string;
};

type Props = {
  headerLabel: string;
  status?: TicketStatus;
  title: string;
  description: string;
  meta: TicketDraftMeta;
  disabled?: boolean;
  confirming?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  className?: string;
};

const DEFAULT_STATUS: TicketStatus = {
  label: 'Aguardando confirmação',
  tone: 'waiting',
};

/**
 * Card de rascunho ConfirmationGate — Confirmar · Editar · Cancelar (design-system).
 * Label ⌘J no Confirmar é visual apenas (sem keybinding no MVP).
 */
export function TicketDraftCard({
  headerLabel,
  status = DEFAULT_STATUS,
  title,
  description,
  meta,
  disabled = false,
  confirming = false,
  onConfirm,
  onEdit,
  onCancel,
  className = '',
}: Props) {
  const busy = disabled || confirming;

  return (
    <article
      className={['font-ui px-3.5 py-2.5 2xl:px-5 2xl:py-3.5', CHAT_AGENT_SURFACE, className]
        .filter(Boolean)
        .join(' ')}
      aria-busy={confirming || undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] text-[var(--color-text-muted)] 2xl:text-[12.5px]">
          {headerLabel}
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

      <dl className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-1.5 border-t border-[var(--color-border)] pt-2.5 2xl:mt-3.5 2xl:gap-x-4 2xl:pt-3.5">
        <div>
          <dt className="text-[11px] text-[var(--color-text-muted)] 2xl:text-[11.5px]">Tipo</dt>
          <dd className="mt-0.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            {meta.type}
          </dd>
        </div>
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
          <dd className="mt-0.5 text-[12px] font-medium text-[var(--color-text)] 2xl:mt-1 2xl:text-[12.5px]">
            {meta.priority}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 2xl:mt-3.5">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={busy}
          onClick={onConfirm}
          aria-label="Confirmar rascunho"
        >
          {confirming ? 'Confirmando…' : 'Confirmar ⌘J'}
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onEdit}>
          Editar
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </article>
  );
}
