import { redirect } from 'next/navigation';
import { EmployeeShell } from '@/components/chrome/EmployeeShell';
import { EmployeeProfilePanel } from '@/components/profile/EmployeeProfilePanel';
import { Typography } from '@/components/ui/Typography';
import { getAuthService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

/** Dias demo — stub visual do protótipo (sem persistência de alteração de senha). */
const DEMO_PASSWORD_CHANGED_DAYS_AGO = 42;

export default async function ProfilePage() {
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
      <header className="flex h-11 shrink-0 items-center border-b border-[var(--color-border)] px-6">
        <Typography font="schibsted" size={12.5} className="text-[var(--color-text-muted)]">
          Service desk de TI
          <span className="mx-2 text-[var(--color-text)]" aria-hidden>
            ›
          </span>
          <span className="font-medium text-[var(--color-text)]">Meu perfil</span>
        </Typography>
      </header>

      <div className="nexo-scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--color-bg)]">
        <EmployeeProfilePanel
          profile={{
            name: employee.name,
            email: employee.email,
            passwordChangedDaysAgo: DEMO_PASSWORD_CHANGED_DAYS_AGO,
          }}
        />
      </div>
    </EmployeeShell>
  );
}
