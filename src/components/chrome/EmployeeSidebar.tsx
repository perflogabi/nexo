'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NexoLogo } from '@/components/brand/NexoLogo';
import { IconLogout, IconNavChat, IconNavProfile } from '@/components/ui/icons';
import { Typography } from '@/components/ui/Typography';

export type SidebarUser = {
  name: string;
  email: string;
};

type Props = {
  user: SidebarUser;
  /** Força estado (Storybook). Sem valor: responsivo + toggle. */
  collapsed?: boolean;
};

const NAV = [
  { href: '/chat', label: 'Atendimento', icon: IconNavChat },
  { href: '/profile', label: 'Meu perfil', icon: IconNavProfile },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

/**
 * Sidebar do funcionário — expandido (logo + labels) / encolhido (mark N + ícones).
 * Responsivo: encolhe automaticamente abaixo de `lg`; toggle manual no desktop.
 */
export function EmployeeSidebar({ user, collapsed: collapsedProp }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const collapsed = collapsedProp ?? (isNarrow || manualCollapsed);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={[
        'font-ui relative flex h-svh shrink-0 flex-col border-r border-[var(--color-border)] bg-white transition-[width] duration-200',
        collapsed ? 'w-[var(--rail-width)]' : 'w-[var(--sidebar-width)]',
      ].join(' ')}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div
        className={[
          'flex shrink-0',
          collapsed
            ? 'flex-col items-center gap-2 px-2 py-5'
            : 'items-center justify-between gap-2 px-5 py-5',
        ].join(' ')}
      >
        {collapsed ? (
          <NexoLogo variant="mark" height={28} className="object-center" />
        ) : (
          <NexoLogo variant="app" height={22} />
        )}

        {collapsedProp === undefined && !isNarrow ? (
          <button
            type="button"
            onClick={() => setManualCollapsed((v) => !v)}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
            aria-label={collapsed ? 'Expandir menu' : 'Encolher menu'}
            title={collapsed ? 'Expandir' : 'Encolher'}
          >
            <span className="block text-[14px] leading-none" aria-hidden>
              {collapsed ? '»' : '«'}
            </span>
          </button>
        ) : null}
      </div>

      <nav className={['flex flex-1 flex-col gap-1', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={[
                'flex items-center rounded-[var(--radius-sm)] text-[14px] font-medium transition-colors',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5',
                active
                  ? 'bg-[var(--color-bg-nav-active)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className={['mt-auto', collapsed ? 'px-2 pb-4' : 'px-4 pb-4'].join(' ')}>
        {!collapsed ? (
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-avatar)] text-[12px] font-semibold text-[var(--color-primary)]">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <Typography
                font="schibsted"
                size={12.5}
                weight="semibold"
                className="truncate text-[var(--color-text)]"
              >
                {user.name}
              </Typography>
              <Typography
                font="schibsted"
                size={12}
                className="truncate text-[var(--color-text-muted)]"
              >
                {user.email}
              </Typography>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex justify-center" title={`${user.name} · ${user.email}`}>
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-bg-avatar)] text-[12px] font-semibold text-[var(--color-primary)]">
              {initials(user.name)}
            </span>
          </div>
        )}

        <div className="border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair"
            className={[
              'flex w-full items-center rounded-[var(--radius-sm)] text-[14px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] disabled:opacity-60',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-1 py-2',
            ].join(' ')}
          >
            <IconLogout className="size-4" />
            {!collapsed ? <span>{loggingOut ? 'Saindo…' : 'Sair'}</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}
