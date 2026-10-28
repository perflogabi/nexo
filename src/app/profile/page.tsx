import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

export default async function ProfilePage() {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  const employee = await getAuthService().getSessionEmployee(session);
  if (!employee) redirect('/login');

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <Link className="text-sm text-blue-700 underline" href="/chat">
          Voltar ao chat
        </Link>
      </header>
      <dl className="grid gap-3 rounded border border-zinc-200 p-4 text-sm">
        <div>
          <dt className="text-zinc-500">Nome</dt>
          <dd className="font-medium">{employee.name}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">E-mail</dt>
          <dd className="font-medium">{employee.email}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Departamento</dt>
          <dd className="font-medium">{employee.department ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Papel</dt>
          <dd className="font-medium">{employee.role}</dd>
        </div>
      </dl>
      <p className="text-xs text-zinc-500">
        Leitura apenas · stub Fase 3 (fidelidade visual na Fase 5).
      </p>
    </main>
  );
}
