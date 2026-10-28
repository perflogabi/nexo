import type { ReactNode } from 'react';
import { EmployeeSidebar, type SidebarUser } from '@/components/chrome/EmployeeSidebar';

type Props = {
  user: SidebarUser;
  children: ReactNode;
};

/** Shell do funcionário — altura = viewport; sem scroll da página. */
export function EmployeeShell({ user, children }: Props) {
  return (
    <div className="flex h-svh overflow-hidden bg-[var(--color-bg)]">
      <EmployeeSidebar user={user} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
