type Props = {
  options: readonly string[];
  onSelect?: (option: string) => void;
  className?: string;
  /** `sm` = 8px (dentro do Agent Message); `pill` = cápsula. */
  buttonRadius?: 'sm' | 'pill';
};

/** Quick replies — outline branca, borda cinza. */
export function ChatQuickReplies({
  options,
  onSelect,
  className = '',
  buttonRadius = 'sm',
}: Props) {
  const radius =
    buttonRadius === 'pill' ? 'rounded-[var(--radius-pill)]' : 'rounded-[var(--radius-sm)]';

  return (
    <div
      className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Respostas rápidas"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect?.(option)}
          className={[
            'font-ui border border-[var(--color-border)] bg-white',
            'px-3 py-1.5 text-[12.5px] leading-none font-medium text-[var(--color-text)]',
            '2xl:px-3.5 2xl:py-2 2xl:text-[13px]',
            'transition-colors hover:bg-[var(--color-bg-subtle)]',
            radius,
          ].join(' ')}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
