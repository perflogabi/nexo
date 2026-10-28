import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME } from '@/lib/session';

async function logoutAction() {
  'use server';
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  redirect('/login');
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-sm text-zinc-700 underline">
        Sair
      </button>
    </form>
  );
}
