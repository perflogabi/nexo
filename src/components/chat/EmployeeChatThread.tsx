'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatAgentMessage } from '@/components/chat/ChatAgentMessage';
import { ChatAgentMeta } from '@/components/chat/ChatAgentMeta';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatTextBubble } from '@/components/chat/ChatTextBubble';
import { ChatUserBubble } from '@/components/chat/ChatUserBubble';
import {
  CHAT_COLUMN,
  CHAT_COLUMN_WIDTH,
  CHAT_COMPOSER_PAD,
  CHAT_SCROLL_PAD,
  CHAT_THREAD_GAP,
} from '@/components/chat/chat-layout';
import {
  DEMO_QUICK_REPLIES,
  DEMO_TICKET_DETAIL,
  DEMO_TICKETS,
} from '@/components/chat/chat-demo-data';
import {
  fetchConversationMessages,
  fetchMyConversations,
  pickActiveConversation,
  sendEmployeeMessage,
  type EmployeeApiMessage,
} from '@/components/chat/employee-chat-api';
import { TicketDetailCard } from '@/components/chat/TicketDetailCard';
import { TicketSelectList } from '@/components/chat/TicketSelectList';

type Props = {
  /** Só usado no fallback demo (Storybook). */
  messageCount?: number;
  /** Força transcript demo (Storybook / testes estáticos). */
  demo?: boolean;
};

function timeLabel(createdAt: string | Date): string {
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function LiveMessage({ message }: { message: EmployeeApiMessage }) {
  if (message.authorType === 'EMPLOYEE') {
    return <ChatUserBubble>{message.content}</ChatUserBubble>;
  }
  if (message.authorType === 'SYSTEM') {
    return (
      <p className="text-center text-[12px] text-[var(--color-text-muted)]" role="status">
        {message.content}
        {timeLabel(message.createdAt) ? ` · ${timeLabel(message.createdAt)}` : ''}
      </p>
    );
  }
  if (message.authorType === 'ANALYST') {
    return (
      <div className="flex w-full min-w-0 flex-col gap-1">
        <p className="text-[12px] font-semibold text-[var(--color-text-muted)]">Analista</p>
        <ChatTextBubble>{message.content}</ChatTextBubble>
      </div>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 2xl:gap-1.5">
      <ChatAgentMeta actions={['respondeu']} />
      <ChatTextBubble>{message.content}</ChatTextBubble>
    </div>
  );
}

function DemoTranscript({
  selectedTicketId,
  onSelectTicket,
}: {
  selectedTicketId: string;
  onSelectTicket: (id: string) => void;
}) {
  return (
    <>
      <ChatUserBubble>Qual o status do meu chamado?</ChatUserBubble>

      <div className="flex w-full min-w-0 flex-col gap-1 2xl:gap-1.5">
        <ChatAgentMeta actions={['consultou seus chamados']} />
        <ChatTextBubble>Você tem 3 chamados abertos. Sobre qual deles quer saber?</ChatTextBubble>
        <TicketSelectList items={DEMO_TICKETS} value={selectedTicketId} onChange={onSelectTicket} />
      </div>

      <ChatUserBubble>INC-20311 · Notebook lento após atualização</ChatUserBubble>

      <div className="flex w-full min-w-0 flex-col gap-1 2xl:gap-1.5">
        <ChatAgentMeta actions={['consultou o INC-20311', 'calculou o prazo']} />
        <TicketDetailCard
          number={DEMO_TICKET_DETAIL.number}
          status={DEMO_TICKET_DETAIL.status}
          title={DEMO_TICKET_DETAIL.title}
          description={DEMO_TICKET_DETAIL.description}
          meta={DEMO_TICKET_DETAIL.meta}
        />
        <ChatAgentMessage actions={DEMO_QUICK_REPLIES}>
          Está sem atualização há 5 dias, acima do prazo de 3 dias úteis para prioridade média. Quer
          que eu chame um analista?
        </ChatAgentMessage>
      </div>
    </>
  );
}

/**
 * Thread — coluna flex; composer fixo no rodapé; mensagens no espaço restante.
 * Com API: carrega conversa ativa do funcionário; sem API / demo=true: transcript estático.
 */
export function EmployeeChatThread({ messageCount = 16, demo = false }: Props) {
  const [selectedTicketId, setSelectedTicketId] = useState(DEMO_TICKETS[0].id);
  const [live, setLive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmployeeApiMessage[]>([]);
  const [count, setCount] = useState(messageCount);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchMyConversations();
    const active = pickActiveConversation(list);
    if (!active) {
      setLive(true);
      setConversationId(null);
      setMessages([]);
      setCount(0);
      setStatus(null);
      return;
    }
    const detail = await fetchConversationMessages(active.id);
    setLive(true);
    setConversationId(detail.conversation.id);
    setMessages(detail.messages ?? []);
    setCount(detail.conversation.messageCount);
    setStatus(detail.conversation.status);
  }, []);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        if (!cancelled) {
          /* fallback demo visual */
          setLive(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demo, load]);

  async function handleSend(text: string) {
    if (!conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendEmployeeMessage(conversationId, text);
      setMessages((prev) => [...prev, result.message]);
      setCount(result.conversation.messageCount);
      setStatus(result.conversation.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SEND_FAILED');
    } finally {
      setSending(false);
    }
  }

  const showDemo = demo || !live;
  const composerDisabled =
    showDemo || !conversationId || sending || status === 'CLOSED' || count >= 30;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)]">
      {error ? (
        <p
          role="alert"
          className="shrink-0 border-b border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-2 text-[12.5px] text-[var(--color-danger)]"
        >
          Não foi possível enviar ({error}).
        </p>
      ) : null}
      <div
        className={[
          'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain',
          CHAT_SCROLL_PAD,
        ].join(' ')}
      >
        <div className="flex min-h-full w-full flex-col justify-center">
          <div className={[CHAT_COLUMN, CHAT_THREAD_GAP].join(' ')}>
            {showDemo ? (
              <DemoTranscript
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
            ) : messages.length === 0 ? (
              <p className="text-center text-[14px] text-[var(--color-text-muted)]">
                Nenhuma mensagem nesta conversa ainda.
              </p>
            ) : (
              messages.map((m) => <LiveMessage key={m.id} message={m} />)
            )}
          </div>
        </div>
      </div>

      <div className={['shrink-0 bg-[var(--color-bg)]', CHAT_COMPOSER_PAD].join(' ')}>
        <div className={CHAT_COLUMN_WIDTH}>
          <ChatComposer
            messageCount={showDemo ? messageCount : count}
            disabled={composerDisabled}
            onSend={(text) => void handleSend(text)}
            placeholder={
              status === 'WAITING_ANALYST' || status === 'WITH_ANALYST'
                ? 'Escreva para o analista...'
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
