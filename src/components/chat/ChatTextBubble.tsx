import type { ReactNode } from 'react';
import { CHAT_AGENT_BUBBLE } from '@/components/chat/chat-layout';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Bolha de texto do agent — TL 2px; ~20px de folga à direita. */
export function ChatTextBubble({ children, className = '' }: Props) {
  return (
    <div
      className={[
        'font-ui block px-3.5 py-2 text-[13px] leading-snug text-[var(--color-text)]',
        '2xl:px-4 2xl:py-2.5 2xl:text-[14px] 2xl:leading-relaxed',
        CHAT_AGENT_BUBBLE,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
