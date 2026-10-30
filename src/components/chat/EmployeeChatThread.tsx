'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isTicketDetailPayload,
  isTicketDraftPayload,
  isTicketSelectPayload,
} from '@/lib/chat-ui-payload';
import { useChatPoll } from '@/lib/chat-poll';
import {
  filterEmployeeVisibleMessages,
  isAnalystOnlySystemMessage,
} from '@/lib/employee-visible-messages';
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
  actionLabelsFromTrace,
  confirmTicketDraft,
  createMyConversation,
  fetchConversationMessages,
  fetchMyConversations,
  pickActiveConversation,
  sendEmployeeMessage,
  type EmployeeApiMessage,
  type EmployeeApiTrace,
} from '@/components/chat/employee-chat-api';
import { TicketDetailCard } from '@/components/chat/TicketDetailCard';
import { ConversationClosedNotice } from '@/components/chat/ConversationClosedNotice';
import { TicketDraftCard } from '@/components/chat/TicketDraftCard';
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

function LiveMessage({
  message,
  actions,
  selectedTicketId,
  onSelectTicket,
  draftBusy,
  dismissedDraftIds,
  onConfirmDraft,
  onEditDraft,
  onCancelDraft,
}: {
  message: EmployeeApiMessage;
  actions?: string[];
  selectedTicketId: string;
  onSelectTicket: (id: string, label: string) => void;
  draftBusy: boolean;
  dismissedDraftIds: ReadonlySet<string>;
  onConfirmDraft: (messageId: string, token: string) => void;
  onEditDraft: (messageId: string) => void;
  onCancelDraft: (messageId: string) => void;
}) {
  if (message.authorType === 'EMPLOYEE') {
    return <ChatUserBubble>{message.content}</ChatUserBubble>;
  }
  if (message.authorType === 'SYSTEM') {
    if (isAnalystOnlySystemMessage(message)) return null;
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

  const payload = message.structuredPayload;
  const ticketSelect = isTicketSelectPayload(payload) ? payload : null;
  const ticketDetail = isTicketDetailPayload(payload) ? payload : null;
  const ticketDraft =
    isTicketDraftPayload(payload) && !dismissedDraftIds.has(message.id) ? payload : null;
  const listValue =
    ticketSelect?.items.some((i) => i.id === selectedTicketId) === true
      ? selectedTicketId
      : (ticketSelect?.items[0]?.id ?? '');

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 2xl:gap-1.5">
      <ChatAgentMeta
        actions={
          ticketDetail
            ? actions?.length
              ? actions
              : [`consultou o ${ticketDetail.number}`, 'calculou o prazo']
            : ticketDraft
              ? actions?.length
                ? actions
                : ['preparou rascunho do chamado']
              : actions?.length
                ? actions
                : ['respondeu']
        }
      />
      {ticketSelect && ticketSelect.items.length > 0 ? (
        <>
          <ChatTextBubble>{message.content}</ChatTextBubble>
          <TicketSelectList
            items={ticketSelect.items}
            value={listValue}
            name={`ticket-select-${message.id}`}
            onChange={(id) => {
              const item = ticketSelect.items.find((t) => t.id === id);
              if (!item) return;
              onSelectTicket(id, `${item.number} · ${item.title}`);
            }}
          />
        </>
      ) : null}
      {ticketDetail ? (
        <>
          <TicketDetailCard
            number={ticketDetail.number}
            status={ticketDetail.status}
            title={ticketDetail.title}
            description={ticketDetail.description}
            meta={ticketDetail.meta}
          />
          <ChatAgentMessage
            actions={
              ticketDetail.quickReplies ?? [
                'Falar com um analista',
                'Adicionar informação',
                'Não, obrigado',
              ]
            }
            onAction={(option) => onSelectTicket(ticketDetail.number, option)}
          >
            {message.content}
          </ChatAgentMessage>
        </>
      ) : null}
      {ticketDraft ? (
        <>
          <ChatTextBubble>{message.content}</ChatTextBubble>
          <TicketDraftCard
            headerLabel={ticketDraft.headerLabel}
            status={ticketDraft.status}
            title={ticketDraft.title}
            description={ticketDraft.description}
            meta={ticketDraft.meta}
            disabled={draftBusy}
            confirming={draftBusy}
            onConfirm={() => onConfirmDraft(message.id, ticketDraft.confirmationToken)}
            onEdit={() => onEditDraft(message.id)}
            onCancel={() => onCancelDraft(message.id)}
          />
        </>
      ) : null}
      {!ticketSelect && !ticketDetail && !ticketDraft ? (
        <ChatTextBubble>{message.content}</ChatTextBubble>
      ) : null}
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
  const [traceByMessageId, setTraceByMessageId] = useState<Record<string, EmployeeApiTrace>>({});
  const [count, setCount] = useState(messageCount);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [dismissedDraftIds, setDismissedDraftIds] = useState<Set<string>>(() => new Set());

  const applyConversationDetail = useCallback(
    (detail: {
      conversation: { id: string; messageCount: number; status: string };
      messages: EmployeeApiMessage[];
    }) => {
      setLive(true);
      setConversationId(detail.conversation.id);
      setMessages(filterEmployeeVisibleMessages(detail.messages ?? []));
      setCount(detail.conversation.messageCount);
      setStatus(detail.conversation.status);
    },
    [],
  );

  const load = useCallback(async () => {
    const list = await fetchMyConversations();
    // Mantém WAITING/WITH_ANALYST/CLOSED recente — não cria sessão nova no reload.
    let active = pickActiveConversation(list);
    if (!active) {
      active = await createMyConversation();
    }
    const detail = await fetchConversationMessages(active.id);
    applyConversationDetail(detail);
  }, [applyConversationDetail]);

  const startNewConversation = useCallback(async () => {
    setError(null);
    const created = await createMyConversation();
    const detail = await fetchConversationMessages(created.id);
    applyConversationDetail(detail);
  }, [applyConversationDetail]);

  const refreshOpenConversation = useCallback(async () => {
    if (!conversationId || sending) return;
    const detail = await fetchConversationMessages(conversationId);
    applyConversationDetail(detail);
  }, [applyConversationDetail, conversationId, sending]);

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

  // Poll enquanto há humano na fila / no atendimento (Vercel sem WebSocket).
  useChatPoll(
    !demo && live && (status === 'WAITING_ANALYST' || status === 'WITH_ANALYST'),
    refreshOpenConversation,
  );

  async function handleSend(text: string) {
    if (sending || status === 'CLOSED') return;
    setSending(true);
    setError(null);

    const optimisticId = `local_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        conversationId: conversationId ?? 'pending',
        authorType: 'EMPLOYEE',
        authorId: null,
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      let activeId = conversationId;
      if (!activeId) {
        const created = await createMyConversation();
        activeId = created.id;
        setConversationId(created.id);
        setStatus(created.status);
      }

      const result = await sendEmployeeMessage(activeId, text);
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        const next = [...withoutOptimistic, result.message];
        if (result.agentMessage) next.push(result.agentMessage);
        return next;
      });
      if (result.trace && result.agentMessage) {
        setTraceByMessageId((prev) => ({
          ...prev,
          [result.agentMessage!.id]: result.trace!,
        }));
      }
      setCount(result.conversation.messageCount);
      setStatus(result.conversation.status);
      if (result.conversation.status === 'WAITING_ANALYST') {
        try {
          const detail = await fetchConversationMessages(activeId);
          setMessages(detail.messages ?? []);
          setCount(detail.conversation.messageCount);
          setStatus(detail.conversation.status);
        } catch {
          /* mantém next local */
        }
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setError(e instanceof Error ? e.message : 'SEND_FAILED');
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmDraft(messageId: string, token: string) {
    if (!conversationId || draftBusy) return;
    setDraftBusy(true);
    setError(null);
    try {
      const result = await confirmTicketDraft(conversationId, token);
      setDismissedDraftIds((prev) => new Set(prev).add(messageId));
      setMessages((prev) => [
        ...prev,
        {
          id: `local_confirm_${Date.now()}`,
          conversationId,
          authorType: 'SYSTEM',
          authorId: null,
          content: `Chamado ${result.ticket.number} registrado (${result.ticket.status}).`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CONFIRM_FAILED');
    } finally {
      setDraftBusy(false);
    }
  }

  function handleCancelDraft(messageId: string) {
    setDismissedDraftIds((prev) => new Set(prev).add(messageId));
  }

  function handleEditDraft(messageId: string) {
    setDismissedDraftIds((prev) => new Set(prev).add(messageId));
  }

  const showDemo = demo || !live;
  // Composer liberado no live mesmo sem conversa ainda — 1º envio cria a sessão.
  const composerDisabled = showDemo || sending || status === 'CLOSED' || count >= 30;

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
                Olá! Sou o Nexo Assist. Escreva sua dúvida de TI para começar.
              </p>
            ) : (
              messages.map((m) => (
                <LiveMessage
                  key={m.id}
                  message={m}
                  selectedTicketId={selectedTicketId}
                  onSelectTicket={(id, label) => {
                    setSelectedTicketId(id);
                    void handleSend(label);
                  }}
                  draftBusy={draftBusy}
                  dismissedDraftIds={dismissedDraftIds}
                  onConfirmDraft={(messageId, token) => void handleConfirmDraft(messageId, token)}
                  onEditDraft={handleEditDraft}
                  onCancelDraft={handleCancelDraft}
                  actions={
                    m.authorType === 'AGENT'
                      ? actionLabelsFromTrace(traceByMessageId[m.id])
                      : undefined
                  }
                />
              ))
            )}
            {sending && status !== 'WAITING_ANALYST' && status !== 'WITH_ANALYST' ? (
              <p
                className="text-[12.5px] text-[var(--color-text-muted)]"
                role="status"
                aria-live="polite"
              >
                Nexo Assist está respondendo…
              </p>
            ) : null}
            {!showDemo && status === 'CLOSED' ? (
              <>
                <ConversationClosedNotice />
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    className="text-[13px] font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                    onClick={() => void startNewConversation()}
                  >
                    Iniciar nova conversa
                  </button>
                </div>
              </>
            ) : null}
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
