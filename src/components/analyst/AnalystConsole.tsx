'use client';

import { useEffect, useState } from 'react';
import { AnalystChatPane } from '@/components/analyst/AnalystChatPane';
import { AnalystShell, type AnalystMobilePane } from '@/components/analyst/AnalystShell';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';
import { DEMO_CONVERSATIONS } from '@/components/analyst/analyst-demo-data';

type Props = {
  analystInitials?: string;
};

const LG_QUERY = '(min-width: 1024px)';

/** Console completo — responsivo; desktop mantém 4 faixas do protótipo. */
export function AnalystConsole({ analystInitials = 'RL' }: Props) {
  const [selectedId, setSelectedId] = useState(DEMO_CONVERSATIONS[0]?.id ?? '');
  const [claimed, setClaimed] = useState(false);
  const [mobilePane, setMobilePane] = useState<AnalystMobilePane>('list');
  const [ticketsOpen, setTicketsOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const sync = () => {
      // Desktop: painel inline aberto por padrão. Estreito: sheet fechado.
      setTicketsOpen(mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    setMobilePane('chat');
  }

  return (
    <AnalystShell
      analystInitials={analystInitials}
      selectedConversationId={selectedId}
      onSelectConversation={handleSelectConversation}
      mobilePane={mobilePane}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <AnalystChatPane
          claimed={claimed}
          onClaim={() => setClaimed(true)}
          onReturn={() => setClaimed(false)}
          onClose={() => setClaimed(false)}
          onBack={() => setMobilePane('list')}
          onOpenTickets={() => setTicketsOpen(true)}
          ticketsOpen={ticketsOpen}
        />

        {ticketsOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-[var(--color-navy)]/25 lg:hidden"
              aria-label="Fechar painel de chamados"
              onClick={() => setTicketsOpen(false)}
            />
            <AnalystTicketsPanel
              claimed={claimed}
              onClose={() => setTicketsOpen(false)}
              className={[
                /* mobile: bottom sheet */
                'fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,640px)] w-full rounded-t-[16px] border-t border-[var(--color-border)] shadow-[0_-8px_32px_rgba(27,36,48,0.14)]',
                /* tablet: drawer direito */
                'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[300px] md:rounded-none md:border-t-0 md:border-l md:shadow-[-8px_0_24px_rgba(27,36,48,0.1)]',
                /* desktop: faixa inline do protótipo */
                'lg:static lg:z-auto lg:max-h-none lg:w-[300px] lg:rounded-none lg:shadow-none xl:w-[320px]',
              ].join(' ')}
            />
          </>
        ) : null}
      </div>
    </AnalystShell>
  );
}
