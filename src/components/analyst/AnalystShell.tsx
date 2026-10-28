import type { ReactNode } from 'react';
import { AnalystRail } from '@/components/analyst/AnalystRail';
import type { ConversationListItemData } from '@/components/analyst/analyst-demo-data';
import { ConversationList } from '@/components/analyst/ConversationList';

export type AnalystMobilePane = 'list' | 'chat';

type Props = {
  /** Chat + painel de chamados (faixas 3 e 4). */
  children?: ReactNode;
  conversations?: readonly ConversationListItemData[];
  selectedConversationId?: string;
  onSelectConversation?: (id: string) => void;
  /**
   * Em &lt; md: master-detail — só lista ou só chat.
   * Em md–lg e desktop o prop não esconde a lista (split / 4 faixas).
   */
  mobilePane?: AnalystMobilePane;
  analystInitials?: string;
  badgeCount?: number;
};

/**
 * Shell do atendente.
 * - lg+: rail lateral + lista + área (chat | chamados) — protótipo.
 * - md–lg: rail inferior + lista + chat (chamados em sheet).
 * - &lt; md: rail inferior + lista XOR chat.
 */
export function AnalystShell({
  children,
  conversations,
  selectedConversationId,
  onSelectConversation,
  mobilePane = 'list',
  analystInitials,
  badgeCount,
}: Props) {
  const listHiddenOnPhone = mobilePane === 'chat';
  const chatHiddenOnPhone = mobilePane === 'list';

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[var(--color-bg)] lg:flex-row">
      <AnalystRail
        analystInitials={analystInitials}
        badgeCount={badgeCount}
        className="order-2 lg:order-1"
      />

      <div className="order-1 flex min-h-0 min-w-0 flex-1 overflow-hidden lg:order-2">
        <ConversationList
          items={conversations}
          selectedId={selectedConversationId}
          onSelect={onSelectConversation}
          className={[listHiddenOnPhone ? 'hidden' : 'flex', 'md:flex'].join(' ')}
        />
        <div
          className={[
            'min-h-0 min-w-0 flex-1 overflow-hidden',
            chatHiddenOnPhone ? 'hidden' : 'flex',
            'md:flex',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
