import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/app/logout-button';
import { getConversationService } from '@/lib/services';
import { readSession } from '@/lib/server-session';
import { ChatClient } from './chat-client';

export default async function ChatPage() {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  const service = getConversationService();
  let conversations = await service.listMyConversations(session.employeeId);
  if (conversations.length === 0) {
    const created = await service.createConversation(session.employeeId);
    conversations = [created];
  }

  const active = conversations[0]!;
  const messages = await service.listMessages(active.id, session.employeeId);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Nexo Assist · funcionário</p>
          <h1 className="text-2xl font-semibold">Chat</h1>
          <p className="text-sm text-zinc-600">{session.name} · stub Fase 3 (UI fiel na Fase 5)</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link className="text-blue-700 underline" href="/profile">
            Perfil
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <ChatClient
        conversationId={active.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          authorType: m.authorType,
          content: m.content,
        }))}
        messageCount={active.messageCount}
        status={active.status}
      />
    </main>
  );
}
