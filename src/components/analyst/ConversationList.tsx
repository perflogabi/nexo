'use client';

import { useMemo, useState } from 'react';
import { ConversationListItem } from '@/components/analyst/ConversationListItem';
import {
  CONVERSATION_FILTERS,
  DEMO_CONVERSATIONS,
  type ConversationFilterId,
  type ConversationListItemData,
} from '@/components/analyst/analyst-demo-data';
import { IconSearch } from '@/components/ui/icons';

type Props = {
  items?: readonly ConversationListItemData[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * Coluna Conversas — título, Disponível, busca, filtros pill, lista.
 * Largura fluida no mobile; coluna fixa a partir de md (tablet+) / lg (desktop).
 */
export function ConversationList({
  items = DEMO_CONVERSATIONS,
  selectedId: selectedIdProp,
  onSelect,
  className = '',
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ConversationFilterId>('para-voce');
  const [internalSelected, setInternalSelected] = useState(items[0]?.id ?? '');
  const selectedId = selectedIdProp ?? internalSelected;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q) ||
        item.status.label.toLowerCase().includes(q),
    );
  }, [items, query]);

  function handleSelect(id: string) {
    setInternalSelected(id);
    onSelect?.(id);
  }

  return (
    <section
      className={[
        'font-ui flex h-full min-h-0 shrink-0 flex-col border-[var(--color-border)] bg-white',
        'w-full border-b md:w-[260px] md:border-r md:border-b-0',
        'lg:w-[300px] xl:w-[320px] 2xl:w-[340px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Lista de conversas"
    >
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[18px] font-semibold text-[var(--color-text)]">Conversas</h1>
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-success-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-success)]">
            <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden />
            Disponível
          </span>
        </div>

        <label className="mt-3 flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] px-3">
          <IconSearch className="size-3.5 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar conversa ou chamado"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </label>

        <div
          className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filtros de conversas"
        >
          {CONVERSATION_FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={[
                  'shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-medium transition-colors',
                  active
                    ? 'bg-[var(--color-bg-nav-active)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                {tab.label}
                {tab.count != null ? (
                  <span className={active ? ' font-semibold' : ''}> {tab.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="nexo-scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        <ul className="divide-y divide-[var(--color-border)]">
          {filtered.map((item) => (
            <li key={item.id} className={selectedId === item.id ? 'py-0.5' : ''}>
              <ConversationListItem
                item={item}
                selected={selectedId === item.id}
                onSelect={handleSelect}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
