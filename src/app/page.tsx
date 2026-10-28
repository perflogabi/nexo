import { redirect } from 'next/navigation';
import { homePathForRole } from '@/lib/session';
import { readSession } from '@/lib/server-session';

export default async function Home() {
  const session = await readSession();
  if (!session) {
    redirect('/login');
  }
  redirect(homePathForRole(session.role));
}
