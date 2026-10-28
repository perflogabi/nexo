import { redirect } from 'next/navigation';
import { LogoutButton } from '@/app/logout-button';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';

export default async function AnalystPage() {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    redirect('/login');
  }

  const queue = await prisma.conversation.findMany({
    where: { status: 'WAITING_ANALYST' },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { employee: { select: { name: true, email: true } } },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Console do analista · stub Fase 3</p>
          <h1 className="text-2xl font-semibold">Fila WAITING_ANALYST</h1>
          <p className="text-sm text-zinc-600">{session.name}</p>
        </div>
        <LogoutButton />
      </header>
      <ul className="divide-y rounded border border-zinc-200">
        {queue.length === 0 ? (
          <li className="p-4 text-sm text-zinc-500">Nenhuma conversa na fila.</li>
        ) : (
          queue.map((c) => (
            <li key={c.id} className="p-4 text-sm">
              <p className="font-medium">{c.employee.name}</p>
              <p className="text-zinc-600">{c.employee.email}</p>
              <p className="mt-1 text-zinc-500">{c.transferSummary ?? 'Sem resumo'}</p>
            </li>
          ))
        )}
      </ul>
      <p className="text-xs text-zinc-500">
        Assumir / devolver / encerrar e layout de 3 painéis entram nas fases seguintes.
      </p>
    </main>
  );
}
