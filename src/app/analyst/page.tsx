import { redirect } from 'next/navigation';
import { AnalystConsole } from '@/components/analyst/AnalystConsole';
import { getAuthService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

export default async function AnalystPage() {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    redirect('/login?next=%2Fanalyst');
  }

  const employee = await getAuthService().getSessionEmployee(session);
  if (!employee) {
    redirect('/login?next=%2Fanalyst');
  }

  return (
    <AnalystConsole
      analystInitials={employee.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('')}
    />
  );
}
