'use client';

import { useState } from 'react';
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
import { TicketDetailCard } from '@/components/chat/TicketDetailCard';
import { TicketSelectList } from '@/components/chat/TicketSelectList';

type Props = {
  messageCount?: number;
};

/**
 * Thread — coluna flex; composer fixo no rodapé; mensagens no espaço restante
 * (sem crescer a página além do viewport).
 */
export function EmployeeChatThread({ messageCount = 16 }: Props) {
  const [selectedTicketId, setSelectedTicketId] = useState(DEMO_TICKETS[0].id);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)]">
      <div
        className={[
          'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain',
          CHAT_SCROLL_PAD,
        ].join(' ')}
      >
        {/* min-h-full + justify-center: bloco de mensagens centrado no espaço livre. */}
        <div className="flex min-h-full w-full flex-col justify-center">
          <div className={[CHAT_COLUMN, CHAT_THREAD_GAP].join(' ')}>
            <ChatUserBubble>Qual o status do meu chamado?</ChatUserBubble>

            <div className="flex w-full min-w-0 flex-col gap-1 2xl:gap-1.5">
              <ChatAgentMeta actions={['consultou seus chamados']} />
              <ChatTextBubble>
                Você tem 3 chamados abertos. Sobre qual deles quer saber?
              </ChatTextBubble>
              <TicketSelectList
                items={DEMO_TICKETS}
                value={selectedTicketId}
                onChange={setSelectedTicketId}
              />
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
                Está sem atualização há 5 dias, acima do prazo de 3 dias úteis para prioridade
                média. Quer que eu chame um analista?
              </ChatAgentMessage>
            </div>
          </div>
        </div>
      </div>

      <div className={['shrink-0 bg-[var(--color-bg)]', CHAT_COMPOSER_PAD].join(' ')}>
        <div className={CHAT_COLUMN_WIDTH}>
          <ChatComposer messageCount={messageCount} />
        </div>
      </div>
    </div>
  );
}
