'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IconLogout, IconNavChat } from '@/components/ui/icons';
import { ANALYST_RAIL } from '@/components/analyst/analyst-demo-data';

type Props = {
  badgeCount?: number;
  analystInitials?: string;
  className?: string;
};

/**
 * Rail do console analista.
 * Desktop (lg+): coluna ~60px à esquerda (protótipo).
 * Mobile/tablet: barra inferior — libera largura para lista + chat.
 */
export function AnalystRail({
  badgeCount = ANALYST_RAIL.badgeCount,
  analystInitials = ANALYST_RAIL.analystInitials,
  className = '',
}: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
        'font-ui flex shrink-0 items-center bg-[var(--color-bg-subtle)]',
        /* mobile / tablet: bottom bar */
        'h-14 w-full flex-row justify-between border-t border-[var(--color-border)] px-6',
        'pb-[max(0px,env(safe-area-inset-bottom))]',
        /* desktop: side rail */
        'lg:h-full lg:w-[var(--rail-width)] lg:flex-col lg:justify-start lg:border-t-0 lg:border-r lg:px-0 lg:py-4 lg:pb-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Navegação do atendente"
    >
      <Image
        src="/brand/nexo-mark-rail.png"
        alt="Nexo Assist"
        width={32}
        height={32}
        className="hidden object-contain lg:block"
        priority
      />

      <div className="lg:mt-5">
        <button
          type="button"
          aria-label={`Conversas${badgeCount ? `, ${badgeCount} pendentes` : ''}`}
          aria-current="page"
          className={[
            'relative flex size-10 items-center justify-center rounded-[10px]',
            'bg-white text-[var(--color-text)] shadow-[0_1px_3px_rgba(27,36,48,0.12)]',
          ].join(' ')}
        >
          <IconNavChat className="size-[15px]" />
          {badgeCount > 0 ? (
            <span
              className={[
                'absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center',
                'rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-semibold text-white',
              ].join(' ')}
            >
              {badgeCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-3 lg:mt-auto lg:flex-col lg:gap-3">
        <span className="relative inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-bg-avatar)]">
          <span className="text-[12px] font-semibold text-[var(--color-primary)]">
            {analystInitials}
          </span>
          <span
            className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-[var(--color-bg-subtle)] bg-[var(--color-success)]"
            aria-label="online"
          />
        </span>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          title="Sair"
          aria-label={loggingOut ? 'Saindo' : 'Sair'}
          className={[
            'flex size-9 items-center justify-center rounded-[10px]',
            'text-[var(--color-text-muted)] transition-colors',
            'hover:bg-white hover:text-[var(--color-text)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
          ].join(' ')}
        >
          <IconLogout className="size-4" />
        </button>
      </div>
    </aside>
  );
}
