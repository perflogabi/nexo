'use client';

import { useState, type FormEvent } from 'react';
import { MESSAGE_LIMIT_PER_CONVERSATION } from '@/domain/message-limit';

type Msg = { id: string; authorType: string; content: string };

export function ChatClient(props: {
  conversationId: string;
  initialMessages: Msg[];
  messageCount: number;
  status: string;
}) {
  const [messages, setMessages] = useState(props.initialMessages);
  const [messageCount, setMessageCount] = useState(props.messageCount);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const atLimit = messageCount >= MESSAGE_LIMIT_PER_CONVERSATION;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || atLimit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${props.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Falha ao enviar');
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          authorType: data.message.authorType,
          content: data.message.content,
        },
      ]);
      setMessageCount(data.conversation.messageCount);
      setContent('');
    } catch {
      setError('Erro de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-3 rounded border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">
        Status: {props.status} · {messageCount}/{MESSAGE_LIMIT_PER_CONVERSATION} mensagens nesta
        sessão
      </p>
      <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {messages.length === 0 ? (
          <li className="text-sm text-zinc-500">Nenhuma mensagem ainda.</li>
        ) : (
          messages.map((m) => (
            <li
              key={m.id}
              className={`rounded px-3 py-2 text-sm ${
                m.authorType === 'EMPLOYEE' ? 'bg-slate-800 text-white self-end' : 'bg-zinc-100'
              }`}
            >
              <span className="mb-1 block text-[10px] uppercase opacity-70">{m.authorType}</span>
              {m.content}
            </li>
          ))
        )}
      </ul>
      <form onSubmit={onSubmit} className="mt-auto flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
          placeholder={atLimit ? 'Limite de 30 mensagens atingido' : 'Escreva para o Nexo…'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={atLimit || loading}
        />
        <button
          type="submit"
          disabled={atLimit || loading || !content.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
