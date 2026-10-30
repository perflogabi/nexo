import { CHAT_AGENT_SURFACE } from '@/components/chat/chat-layout';

type Props = {
  className?: string;
};

/**
 * Indicação de atendimento humano encerrado — status + copy curta.
 */
export function ConversationClosedNotice({ className = '' }: Props) {
  return (
    <article
      data-testid="conversation-closed-notice"
      className={['font-ui px-3.5 py-2.5 2xl:px-5 2xl:py-3.5', CHAT_AGENT_SURFACE, className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <header className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] text-[var(--color-text-muted)] 2xl:text-[12.5px]">
          Atendimento encerrado
        </p>
        <p className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--color-text-muted)] 2xl:text-[12.5px]">
          <span className="size-1.5 rounded-full bg-[var(--color-text-muted)]" aria-hidden />
          Encerrado
        </p>
      </header>
      <p className="mt-1.5 text-[13px] leading-snug text-[var(--color-text)] 2xl:mt-2 2xl:text-[14px]">
        O atendimento foi finalizado pelo analista. Esta conversa não está mais em atendimento.
      </p>
    </article>
  );
}
