'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('ana@nexo.local');
  const [password, setPassword] = useState('qualquer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        employee?: { role: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? 'Falha no login');
        return;
      }
      const next = search.get('next');
      if (data.employee?.role === 'ANALYST') {
        router.replace(next?.startsWith('/analyst') ? next : '/analyst');
      } else {
        router.replace(next?.startsWith('/chat') || next?.startsWith('/profile') ? next : '/chat');
      }
      router.refresh();
    } catch {
      setError('Erro de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-zinc-500">Nexo Assist</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Identificação</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Demo: qualquer senha. Exemplos: ana@nexo.local, bruno@nexo.local, analista@nexo.local
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            className="rounded border border-zinc-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            className="rounded border border-zinc-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-8">Carregando…</main>}>
      <LoginForm />
    </Suspense>
  );
}
