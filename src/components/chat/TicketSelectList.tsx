'use client';

import { CHAT_AGENT_SURFACE } from '@/components/chat/chat-layout';
import { ticketStatusDotClass, type TicketStatus } from '@/components/chat/ticket-status';

export type TicketSelectItem = {
  id: string;
  number: string;
  title: string;
  status: TicketStatus;
  dateLabel: string;
};

type Props = {
  items: readonly TicketSelectItem[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
  className?: string;
};

/** Lista de seleção — mesma largura da coluna (min-w-0 no fieldset). */
export function TicketSelectList({
  items,
  value,
  onChange,
  name = 'ticket-select',
  className = '',
}: Props) {
  return (
    <fieldset
      className={['m-0 min-w-0 overflow-hidden p-0', CHAT_AGENT_SURFACE, className]
        .filter(Boolean)
        .join(' ')}
    >
      <legend className="sr-only">Selecione um chamado</legend>
      <ul className="divide-y divide-[var(--color-border)]">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <li key={item.id}>
              <label
                className={[
                  'font-ui flex cursor-pointer items-center gap-2 px-3 py-1.5 transition-colors 2xl:gap-3 2xl:px-3.5 2xl:py-2',
                  selected
                    ? 'bg-[var(--color-bg-subtle)]'
                    : 'bg-white hover:bg-[var(--color-bg-subtle)]/60',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name={name}
                  value={item.id}
                  checked={selected}
                  onChange={() => onChange(item.id)}
                  className="size-3.5 shrink-0 accent-[var(--color-primary)] 2xl:size-4"
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] leading-snug 2xl:text-[13.5px]">
                  <span className="font-medium text-[var(--color-text-muted)]">{item.number}</span>
                  <span className="text-[var(--color-text-muted)]"> · </span>
                  <span className="font-semibold text-[var(--color-text)]">{item.title}</span>
                </span>
                <span className="hidden shrink-0 items-center gap-1.5 text-[11.5px] text-[var(--color-text-muted)] md:inline-flex 2xl:text-[12.5px]">
                  <span
                    className={[
                      'size-1.5 rounded-full',
                      ticketStatusDotClass(item.status.tone),
                    ].join(' ')}
                    aria-hidden
                  />
                  {item.status.label}
                </span>
                <span className="shrink-0 text-[11.5px] text-[var(--color-text-muted)] 2xl:text-[12.5px]">
                  {item.dateLabel}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
