import { IconDoubleCheck } from '@/components/ui/icons';
import type { ConversationListItemData } from '@/components/analyst/analyst-demo-data';

const AVATAR_BG: Record<ConversationListItemData['avatarTone'], string> = {
  blue: 'bg-[#DCEBFA] text-[#1D4F91]',
  peach: 'bg-[#F8E4D4] text-[#8A4B2A]',
  lavender: 'bg-[#E8E0F5] text-[#5B4A8A]',
  mint: 'bg-[#D8F0E4] text-[#2F6B52]',
  pink: 'bg-[#F7DDE6] text-[#8A3D5C]',
  slate: 'bg-[#E4E7EC] text-[#4B5563]',
  sand: 'bg-[#F3EBD4] text-[#7A5C28]',
};

const STATUS_DOT: Record<ConversationListItemData['status']['tone'], string> = {
  transfer: 'bg-[var(--color-danger)]',
  help: 'bg-[var(--color-warning)]',
  active: 'bg-[var(--color-success)]',
  resolved: 'bg-[var(--color-text-muted)]',
};

const STATUS_TEXT: Record<ConversationListItemData['status']['tone'], string> = {
  transfer: 'text-[var(--color-danger)]',
  help: 'text-[var(--color-warning-text)]',
  active: 'text-[var(--color-text-muted)]',
  resolved: 'text-[var(--color-text-muted)]',
};

type Props = {
  item: ConversationListItemData;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

/** Item da lista Conversas — avatar, preview, status, unread. */
export function ConversationListItem({ item, selected = false, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      className={[
        'font-ui flex w-full gap-3 px-3 py-2.5 text-left transition-colors',
        selected
          ? 'rounded-[12px] bg-[var(--color-bg-subtle)] shadow-[0_1px_2px_rgba(27,36,48,0.06)]'
          : 'rounded-none hover:bg-[var(--color-bg-subtle)]/50',
      ].join(' ')}
    >
      <span className="relative shrink-0">
        <span
          className={[
            'flex size-9 items-center justify-center rounded-full text-[12px] font-semibold',
            AVATAR_BG[item.avatarTone],
          ].join(' ')}
        >
          {item.initials}
        </span>
        {item.online ? (
          <span
            className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-[var(--color-success)]"
            aria-hidden
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13.5px] font-semibold text-[var(--color-text)]">
            {item.name}
          </span>
          <span
            className={[
              'shrink-0 text-[11.5px]',
              item.timeEmphasis || selected
                ? 'font-semibold text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)]',
            ].join(' ')}
          >
            {item.timeLabel}
          </span>
        </span>

        <span className="mt-0.5 flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            <span
              className={[
                'flex items-center gap-1 truncate text-[12.5px] leading-snug',
                item.previewKind === 'typing'
                  ? 'italic text-[var(--color-success)]'
                  : 'text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              {item.previewKind === 'nexo' ? (
                <IconDoubleCheck
                  className={[
                    'size-3.5 shrink-0',
                    item.status.tone === 'resolved'
                      ? 'text-[var(--color-text-muted)]'
                      : 'text-[var(--color-primary)]',
                  ].join(' ')}
                />
              ) : null}
              <span className="truncate">{item.preview}</span>
            </span>
            <span
              className={[
                'mt-0.5 flex items-center gap-1.5 text-[11.5px] leading-snug',
                STATUS_TEXT[item.status.tone],
              ].join(' ')}
            >
              <span
                className={['size-1.5 shrink-0 rounded-full', STATUS_DOT[item.status.tone]].join(
                  ' ',
                )}
                aria-hidden
              />
              <span className="truncate">{item.status.label}</span>
            </span>
          </span>

          {item.unread && item.unread > 0 ? (
            <span className="mt-0.5 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-semibold text-white">
              {item.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
