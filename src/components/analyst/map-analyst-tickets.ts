import type {
  AnalystTicketListItem,
  AnalystTicketTone,
} from '@/components/analyst/analyst-demo-data';

export type AnalystApiTicket = {
  id: string;
  number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt: string | Date | null;
  updatedAt: string | Date;
};

const CATEGORY_LABEL: Record<string, string> = {
  ACESSO: 'Acesso',
  REDE_VPN: 'Rede/VPN',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  EMAIL: 'E-mail',
  OUTROS: 'Outros',
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'crítica',
  HIGH: 'alta',
  MEDIUM: 'média',
  LOW: 'baixa',
};

function statusTone(status: string): AnalystTicketTone {
  if (status === 'WAITING_ANALYST') return 'waiting';
  if (status === 'APPROVED') return 'approved';
  if (status === 'RESOLVED' || status === 'CLOSED') return 'resolved';
  return 'progress';
}

function statusLabel(status: string, claimed: boolean): string {
  switch (status) {
    case 'WAITING_ANALYST':
      return 'Aguardando analista';
    case 'IN_PROGRESS':
      return claimed ? 'Em atendimento' : 'Em andamento';
    case 'OPEN':
      return claimed ? 'Em atendimento' : 'Aberto';
    case 'APPROVED':
      return 'Aprovado';
    case 'RESOLVED':
      return 'Resolvido';
    case 'CLOSED':
      return 'Encerrado';
    default:
      return status;
  }
}

function formatResolved(resolvedAt: string | Date | null): string | null {
  if (!resolvedAt) return null;
  const d = typeof resolvedAt === 'string' ? new Date(resolvedAt) : resolvedAt;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isOpenStatus(status: string): boolean {
  return status === 'OPEN' || status === 'WAITING_ANALYST' || status === 'IN_PROGRESS';
}

export type AnalystTicketsPanelModel = {
  firstName: string;
  openCount: number;
  closedCount: number;
  current: {
    number: string;
    title: string;
    statusLabel: string;
    statusTone: AnalystTicketTone;
    meta: string;
    eventLabel: string;
    eventTime: string;
    eventIcon: 'transfer' | 'claim';
  } | null;
  others: AnalystTicketListItem[];
};

export function mapTicketsForAnalystPanel(input: {
  employeeName: string;
  tickets: AnalystApiTicket[];
  claimed: boolean;
  conversationStatus: string;
  transferSummary: string | null;
  updatedAt?: string | Date;
}): AnalystTicketsPanelModel {
  const firstName = input.employeeName.trim().split(/\s+/)[0] || 'Funcionário';
  const openCount = input.tickets.filter((t) => isOpenStatus(t.status)).length;
  const closedCount = input.tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED' || t.status === 'APPROVED',
  ).length;

  const featured =
    input.tickets.find((t) => t.status === 'WAITING_ANALYST') ??
    input.tickets.find((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') ??
    input.tickets[0] ??
    null;

  const eventTime = (() => {
    if (!input.updatedAt) return '—';
    const d = typeof input.updatedAt === 'string' ? new Date(input.updatedAt) : input.updatedAt;
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  })();

  const current = featured
    ? {
        number: featured.number,
        title: featured.title,
        statusLabel: statusLabel(
          featured.status === 'OPEN' && input.conversationStatus === 'WAITING_ANALYST'
            ? 'WAITING_ANALYST'
            : featured.status === 'OPEN' && input.claimed
              ? 'IN_PROGRESS'
              : featured.status,
          input.claimed,
        ),
        statusTone: statusTone(
          featured.status === 'OPEN' && input.conversationStatus === 'WAITING_ANALYST'
            ? 'WAITING_ANALYST'
            : featured.status === 'OPEN' && input.claimed
              ? 'IN_PROGRESS'
              : featured.status,
        ),
        meta: `${CATEGORY_LABEL[featured.category] ?? featured.category} · prioridade ${PRIORITY_LABEL[featured.priority] ?? featured.priority}`,
        eventLabel: input.claimed
          ? 'Assumido por você'
          : input.transferSummary?.trim() || 'Transferido para um analista',
        eventTime,
        eventIcon: (input.claimed ? 'claim' : 'transfer') as 'claim' | 'transfer',
      }
    : null;

  const others = input.tickets
    .filter((t) => !featured || t.id !== featured.id)
    .map((t): AnalystTicketListItem => {
      const resolved = formatResolved(t.resolvedAt);
      let meta = `${t.number} · ${statusLabel(t.status, false)}`;
      if (resolved && (t.status === 'RESOLVED' || t.status === 'CLOSED')) {
        meta = `${t.number} · Resolvido em ${resolved}`;
      } else if (t.status === 'APPROVED' && resolved) {
        meta = `${t.number} · Aprovado`;
      }
      return {
        id: t.id,
        title: t.title,
        meta,
        tone: statusTone(t.status),
      };
    });

  return { firstName, openCount, closedCount, current, others };
}
