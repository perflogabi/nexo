import type { ReactNode } from 'react';
import { IconCheck } from '@/components/ui/icons';

type Props = {
  actions?: readonly string[];
  className?: string;
  children?: ReactNode;
};

/** Label “Nexo Assist” + chips `✓ ação` (transparência do agent). */
export function ChatAgentMeta({ actions = [], className = '', children }: Props) {
  return (
    <div
      className={[
        'font-ui flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] leading-snug 2xl:text-[12.5px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="font-semibold text-[var(--color-text)]">Nexo Assist</span>
      {actions.map((action) => (
        <span
          key={action}
          className="inline-flex items-center gap-1 text-[var(--color-text-muted)]"
        >
          <IconCheck className="size-3.5 text-[var(--color-text-muted)]" />
          {action}
        </span>
      ))}
      {children}
    </div>
  );
}
