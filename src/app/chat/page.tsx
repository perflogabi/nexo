import { redirect } from 'next/navigation';
import { EmployeeChatThread } from '@/components/chat/EmployeeChatThread';
import { EmployeeShell } from '@/components/chrome/EmployeeShell';
import { Typography } from '@/components/ui/Typography';
import { getAuthService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

export default async function ChatPage() {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  const employee = await getAuthService().getSessionEmployee(session);
  if (!employee) {
    redirect('/login');
  }

  return (
    <EmployeeShell user={{ name: employee.name, email: employee.email }}>
      <header className="flex h-11 shrink-0 items-center justify-between gap-6 border-b border-[var(--color-border)] px-6">
        <Typography font="schibsted" size={12.5} className="text-[var(--color-text-muted)]">
          Service desk de TI
          <span className="mx-2 text-[var(--color-text)]" aria-hidden>
            ›
          </span>
          <span className="text-[var(--color-text)]">Atendimento</span>
        </Typography>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-success-soft)] px-3 py-1 text-[12.5px] font-medium text-[var(--color-success)]">
          <span className="size-2 rounded-full bg-[var(--color-success)]" aria-hidden />
          Assistente online
        </span>
      </header>

      <EmployeeChatThread />
    </EmployeeShell>
  );
}
