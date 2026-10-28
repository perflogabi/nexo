import type { ReactNode } from 'react';
import { CHAT_AGENT_BUBBLE } from '@/components/chat/chat-layout';
import { ChatQuickReplies } from '@/components/chat/ChatQuickReplies';

type Props = {
  children: ReactNode;
  actions?: readonly string[];
  onAction?: (option: string) => void;
  className?: string;
};

/** Bolha do agent — TL 2px; texto + CTAs; ~20px de folga à direita. */
export function ChatAgentMessage({ children, actions, onAction, className = '' }: Props) {
  return (
    <div
      className={[
        'font-ui block px-3.5 py-2 text-[13px] leading-snug text-[var(--color-text)]',
        '2xl:px-4 2xl:py-3 2xl:text-[14px] 2xl:leading-relaxed',
        CHAT_AGENT_BUBBLE,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="w-full">{children}</div>
      {actions && actions.length > 0 ? (
        <ChatQuickReplies
          options={actions}
          onSelect={onAction}
          className="mt-2 w-full 2xl:mt-3"
          buttonRadius="sm"
        />
      ) : null}
    </div>
  );
}
