'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginSplitLayout } from '@/components/auth/LoginSplitLayout';

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();

  return (
    <LoginSplitLayout
      form={
        <LoginForm
          onSubmit={async ({ email, password }) => {
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
              throw new Error(data.error?.message ?? 'Credenciais inválidas');
            }
            const next = search.get('next');
            if (data.employee?.role === 'ANALYST') {
              router.replace(next?.startsWith('/analyst') ? next : '/analyst');
            } else {
              router.replace(
                next?.startsWith('/chat') || next?.startsWith('/profile') ? next : '/chat',
              );
            }
            router.refresh();
          }}
        />
      }
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-muted)]">
          Carregando…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
