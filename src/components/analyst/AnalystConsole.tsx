'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChatPoll } from '@/lib/chat-poll';
import {
  claimAnalystConversation,
  closeAnalystConversation,
  fetchAnalystConversations,
  fetchAnalystMessages,
  fetchAnalystTicketsPanel,
  returnAnalystConversation,
  sendAnalystMessage,
  type AnalystConversationDetail,
} from '@/components/analyst/analyst-api';
import {
  AnalystChatPane,
  type AnalystChatEmployeeHeader,
} from '@/components/analyst/AnalystChatPane';
import { AnalystShell, type AnalystMobilePane } from '@/components/analyst/AnalystShell';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';
import {
  DEMO_ANALYST_CHAT,
  DEMO_CONVERSATIONS,
  type AnalystChatMessage,
  type ConversationListItemData,
} from '@/components/analyst/analyst-demo-data';
import type { AnalystTicketsPanelModel } from '@/components/analyst/map-analyst-tickets';

type Props = {
  analystInitials?: string;
};

const LG_QUERY = '(min-width: 1024px)';

function isClaimedItem(item: ConversationListItemData | undefined): boolean {
  // "Agent atendendo" também usa tom active — claimed = só pós Assumir.
  return item?.status.label === 'Em atendimento';
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function waitingUntilLabel(updatedAt: string | Date): string {
  const d = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(d.getTime())) return '—';
  const until = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  return until.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function headerFromConversation(
  conversation: AnalystConversationDetail,
  featuredTicketNumber?: string | null,
): AnalystChatEmployeeHeader {
  const firstName = conversation.employee.name.trim().split(/\s+/)[0] || 'Funcionário';
  const dept = conversation.employee.department?.trim() || '—';
  const ticketBit = featuredTicketNumber ? ` · ${featuredTicketNumber}` : '';
  return {
    name: conversation.employee.name,
    initials: initialsFromName(conversation.employee.name),
    firstName,
    metaWaiting: `online · ${dept}${ticketBit}`,
    metaClaimed: `online · ${dept}`,
  };
}

/**
 * Console — lista/claim/devolver/encerrar + transcript e tickets do owner via API.
 */
export function AnalystConsole({ analystInitials = 'RL' }: Props) {
  const [items, setItems] = useState<ConversationListItemData[]>([...DEMO_CONVERSATIONS]);
  const [selectedId, setSelectedId] = useState(DEMO_CONVERSATIONS[0]?.id ?? '');
  const [claimed, setClaimed] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<AnalystMobilePane>('list');
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const [messages, setMessages] = useState<AnalystChatMessage[] | undefined>(undefined);
  const [employeeHeader, setEmployeeHeader] = useState<AnalystChatEmployeeHeader | undefined>(
    undefined,
  );
  const [waitingUntil, setWaitingUntil] = useState<string | undefined>(undefined);
  const [ticketsModel, setTicketsModel] = useState<AnalystTicketsPanelModel | undefined>(undefined);

  const refreshList = useCallback(async () => {
    const list = await fetchAnalystConversations();
    setItems(list);
    setLiveMode(true);
    return list;
  }, []);

  const loadConversationExtras = useCallback(async (id: string, isClaimed: boolean) => {
    // Mensagens primeiro — tickets não podem bloquear o poll do transcript.
    const msgResult = await fetchAnalystMessages(id);
    setMessages(msgResult.messages);
    setWaitingUntil(waitingUntilLabel(msgResult.conversation.updatedAt));
    let featuredTicket: string | null = null;
    try {
      const tickets = await fetchAnalystTicketsPanel(id, isClaimed);
      setTicketsModel(tickets);
      featuredTicket = tickets.current?.number ?? null;
    } catch {
      /* mantém tickets anteriores */
    }
    setEmployeeHeader(headerFromConversation(msgResult.conversation, featuredTicket));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const sync = () => setTicketsOpen(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAnalystConversations();
        if (cancelled || list.length === 0) return;
        setItems(list);
        setLiveMode(true);
        const first = list[0]!;
        setSelectedId(first.id);
        const isClaimed = isClaimedItem(first);
        setClaimed(isClaimed);
        await loadConversationExtras(first.id, isClaimed);
      } catch {
        /* mantém DEMO — Assumir fica só local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversationExtras]);

  const pollLive = useCallback(async () => {
    if (!liveMode || busy) return;
    const list = await refreshList();
    if (list.length === 0) return;

    const stillSelected = selectedId ? list.find((row) => row.id === selectedId) : undefined;
    const newestWaiting = list.find((row) => row.status.tone === 'transfer');
    // Auto-abre transferência nova se a aba atual é só “Agent atendendo” / resolvida.
    const shouldFocusWaiting =
      Boolean(newestWaiting) &&
      (!stillSelected ||
        stillSelected.status.label === 'Agent atendendo' ||
        stillSelected.status.tone === 'resolved');

    const nextId = shouldFocusWaiting ? newestWaiting!.id : (stillSelected?.id ?? list[0]!.id);

    if (nextId !== selectedId) setSelectedId(nextId);
    const current = list.find((row) => row.id === nextId)!;
    const isClaimed = isClaimedItem(current);
    setClaimed(isClaimed);
    await loadConversationExtras(nextId, isClaimed);
  }, [busy, liveMode, loadConversationExtras, refreshList, selectedId]);

  useChatPoll(liveMode, pollLive);

  async function handleSelectConversation(id: string) {
    setSelectedId(id);
    setMobilePane('chat');
    setActionError(null);
    const item = items.find((row) => row.id === id);
    const isClaimed = isClaimedItem(item);
    setClaimed(isClaimed);
    if (!liveMode) return;
    setBusy(true);
    try {
      await loadConversationExtras(id, isClaimed);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'LOAD_FAILED');
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    setActionError(null);
    if (!liveMode) {
      setClaimed(true);
      return;
    }
    setBusy(true);
    try {
      await claimAnalystConversation(selectedId);
      const list = await refreshList();
      const current = list.find((row) => row.id === selectedId);
      const isClaimed = isClaimedItem(current) || true;
      setClaimed(isClaimed);
      await loadConversationExtras(selectedId, true);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'CLAIM_FAILED');
    } finally {
      setBusy(false);
    }
  }

  async function handleReturn() {
    setActionError(null);
    if (!liveMode) {
      setClaimed(false);
      return;
    }
    setBusy(true);
    try {
      await returnAnalystConversation(selectedId);
      const list = await refreshList();
      if (list.length === 0) {
        setItems([]);
        setSelectedId('');
        setClaimed(false);
        setMessages([]);
        setTicketsModel(undefined);
        return;
      }
      const stillThere = list.find((row) => row.id === selectedId);
      if (!stillThere) {
        const next = list[0]!;
        setSelectedId(next.id);
        setClaimed(isClaimedItem(next));
        await loadConversationExtras(next.id, isClaimedItem(next));
      } else {
        setClaimed(isClaimedItem(stillThere));
        await loadConversationExtras(selectedId, isClaimedItem(stillThere));
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'RETURN_FAILED');
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    setActionError(null);
    if (!liveMode) {
      setClaimed(false);
      return;
    }
    setBusy(true);
    try {
      await closeAnalystConversation(selectedId);
      const list = await refreshList();
      if (list.length === 0) {
        setItems([]);
        setSelectedId('');
        setClaimed(false);
        setMessages([]);
        setEmployeeHeader(undefined);
        setTicketsModel(undefined);
        return;
      }
      const next = list[0]!;
      setSelectedId(next.id);
      setClaimed(isClaimedItem(next));
      await loadConversationExtras(next.id, isClaimedItem(next));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'CLOSE_FAILED');
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(text: string) {
    setActionError(null);
    if (!liveMode) {
      setMessages((prev) => [
        ...(prev ?? DEMO_ANALYST_CHAT.messagesClaimed),
        {
          id: `local_${Date.now()}`,
          kind: 'analyst',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          text,
          author: 'Você',
          team: 'Suporte N2',
        },
      ]);
      return;
    }
    try {
      const message = await sendAnalystMessage(selectedId, text);
      setMessages((prev) => [...(prev ?? []), message]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'SEND_FAILED');
      throw e;
    }
  }

  const waitingCount = items.filter((row) => row.status.tone === 'transfer').length;

  return (
    <AnalystShell
      analystInitials={analystInitials}
      badgeCount={waitingCount || undefined}
      conversations={items}
      selectedConversationId={selectedId}
      onSelectConversation={(id) => void handleSelectConversation(id)}
      mobilePane={mobilePane}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {actionError ? (
          <p
            role="alert"
            className="shrink-0 border-b border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-2 text-[12.5px] text-[var(--color-danger)]"
          >
            Não foi possível concluir a ação ({actionError}).
          </p>
        ) : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {selectedId ? (
            <AnalystChatPane
              claimed={claimed}
              busy={busy}
              messages={liveMode ? (messages ?? []) : undefined}
              employee={liveMode ? (employeeHeader ?? null) : undefined}
              waitingUntil={liveMode ? waitingUntil : undefined}
              draftMessage={liveMode ? '' : undefined}
              onSend={(text) => void handleSend(text)}
              onClaim={() => void handleClaim()}
              onReturn={() => void handleReturn()}
              onClose={() => void handleClose()}
              onBack={() => setMobilePane('list')}
              onOpenTickets={() => setTicketsOpen(true)}
              ticketsOpen={ticketsOpen}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[var(--color-bg-chat-console)] px-6 text-center text-[14px] text-[var(--color-text-muted)]">
              Nenhuma conversa na fila. Quando um funcionário pedir analista, ela aparece aqui.
            </div>
          )}

          {ticketsOpen && selectedId ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-[var(--color-navy)]/25 lg:hidden"
                aria-label="Fechar painel de chamados"
                onClick={() => setTicketsOpen(false)}
              />
              <AnalystTicketsPanel
                claimed={claimed}
                model={liveMode ? (ticketsModel ?? null) : undefined}
                onClose={() => setTicketsOpen(false)}
                className={[
                  'fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,640px)] w-full rounded-t-[16px] border-t border-[var(--color-border)] shadow-[0_-8px_32px_rgba(27,36,48,0.14)]',
                  'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[300px] md:rounded-none md:border-t-0 md:border-l md:shadow-[-8px_0_24px_rgba(27,36,48,0.1)]',
                  'lg:static lg:z-auto lg:max-h-none lg:w-[300px] lg:rounded-none lg:shadow-none xl:w-[320px]',
                ].join(' ')}
              />
            </>
          ) : null}
        </div>
      </div>
    </AnalystShell>
  );
}
