import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Bolha do funcionário — direita, navy; compacta &lt;2xl. */
export function ChatUserBubble({ children, className = '' }: Props) {
  return (
    <div className={['flex justify-end', className].filter(Boolean).join(' ')}>
      <p
        className={[
          'font-ui max-w-[min(100%,85%)] rounded-[var(--radius-lg)] rounded-br-[2px]',
          'bg-[var(--color-navy)] px-3.5 py-1.5 text-[13px] leading-snug font-medium',
          'text-[var(--color-text-on-navy)] 2xl:px-4 2xl:py-2 2xl:text-[14px]',
        ].join(' ')}
      >
        {children}
      </p>
    </div>
  );
}
