export type ConversationFilterId = 'todas' | 'para-voce' | 'com-agent' | 'minhas';

export type ConversationListStatusTone = 'transfer' | 'help' | 'active' | 'resolved';

export type ConversationListItemData = {
  id: string;
  name: string;
  initials: string;
  avatarTone: 'blue' | 'peach' | 'lavender' | 'mint' | 'pink' | 'slate' | 'sand';
  online?: boolean;
  timeLabel: string;
  timeEmphasis?: boolean;
  preview: string;
  previewKind?: 'text' | 'typing' | 'nexo';
  status: { tone: ConversationListStatusTone; label: string };
  unread?: number;
};

export const ANALYST_RAIL = {
  badgeCount: 5,
  analystInitials: 'RL',
} as const;

export const CONVERSATION_FILTERS: readonly {
  id: ConversationFilterId;
  label: string;
  count?: number;
}[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'para-voce', label: 'Para você', count: 3 },
  { id: 'com-agent', label: 'Com o agent', count: 9 },
  { id: 'minhas', label: 'Minhas', count: 1 },
] as const;

/** Lista estática fiel ao protótipo Atendente — Conversas. */
export const DEMO_CONVERSATIONS: readonly ConversationListItemData[] = [
  {
    id: 'ana',
    name: 'Ana Souza',
    initials: 'AS',
    avatarTone: 'blue',
    online: true,
    timeLabel: '10:05',
    timeEmphasis: true,
    preview: 'Está parado há 5 dias. Quero falar com...',
    status: { tone: 'transfer', label: 'Transferida · INC-20311' },
    unread: 2,
  },
  {
    id: 'carla',
    name: 'Carla Mendes',
    initials: 'CM',
    avatarTone: 'peach',
    online: true,
    timeLabel: '09:58',
    timeEmphasis: true,
    preview: 'Preciso de acesso ao SAP ainda hoje',
    status: { tone: 'transfer', label: 'Transferida · contato em 25 min' },
    unread: 1,
  },
  {
    id: 'bruno',
    name: 'Bruno Tavares',
    initials: 'BT',
    avatarTone: 'lavender',
    timeLabel: '09:51',
    preview: 'Nexo: Vou chamar um analista para isso.',
    previewKind: 'nexo',
    status: { tone: 'help', label: 'Agent pediu ajuda · confiança 41%' },
  },
  {
    id: 'diego',
    name: 'Diego Ramos',
    initials: 'DR',
    avatarTone: 'mint',
    online: true,
    timeLabel: 'agora',
    preview: 'digitando...',
    previewKind: 'typing',
    status: { tone: 'active', label: 'Agent atendendo' },
  },
  {
    id: 'elisa',
    name: 'Elisa Prado',
    initials: 'EP',
    avatarTone: 'pink',
    timeLabel: '10:03',
    preview: 'Nexo: Chamado INC-20519 criado.',
    previewKind: 'nexo',
    status: { tone: 'active', label: 'Agent atendendo' },
  },
  {
    id: 'fabio',
    name: 'Fábio Nunes',
    initials: 'FN',
    avatarTone: 'slate',
    timeLabel: '10:01',
    preview: 'Isso resolveu, obrigado!',
    status: { tone: 'resolved', label: 'Resolvida pelo agent' },
  },
  {
    id: 'gabriela',
    name: 'Gabriela Rocha',
    initials: 'GR',
    avatarTone: 'sand',
    timeLabel: 'ontem',
    preview: 'Nexo: A senha do Wi-Fi foi enviada...',
    previewKind: 'nexo',
    status: { tone: 'resolved', label: 'Resolvida pelo agent' },
  },
] as const;

export type AnalystSystemIcon = 'transfer' | 'claim';

export type AnalystChatMessage =
  | { id: string; kind: 'employee'; time: string; text: string }
  | { id: string; kind: 'ia'; time: string; text: string }
  | {
      id: string;
      kind: 'analyst';
      time: string;
      text: string;
      author: string;
      team: string;
    }
  | {
      id: string;
      kind: 'system';
      time: string;
      text: string;
      icon?: AnalystSystemIcon;
    };

const DEMO_MESSAGES_WAITING = [
  {
    id: 'm1',
    kind: 'employee',
    time: '10:01',
    text: 'Qual o status do meu chamado?',
  },
  {
    id: 'm2',
    kind: 'ia',
    time: '10:01',
    text: 'Você tem 3 chamados abertos. Sobre qual deles quer saber?',
  },
  {
    id: 'm3',
    kind: 'employee',
    time: '10:02',
    text: 'INC-20311 · Notebook lento após atualização',
  },
  {
    id: 'm4',
    kind: 'ia',
    time: '10:02',
    text: 'Está sem atualização há 5 dias, acima do prazo de 3 dias úteis. Quer que eu chame um analista?',
  },
  { id: 'm5', kind: 'employee', time: '10:04', text: 'Está parado há 5 dias.' },
  { id: 'm6', kind: 'employee', time: '10:04', text: 'Quero falar com um analista.' },
  {
    id: 'm7',
    kind: 'ia',
    time: '10:05',
    text: 'Encaminhei para o Suporte N2. Um analista vai falar com você em até 2 h úteis.',
  },
  {
    id: 'm8',
    kind: 'system',
    time: '10:05',
    icon: 'transfer',
    text: 'Transferida para Suporte N2 · 10:05',
  },
] as const satisfies readonly AnalystChatMessage[];

const DEMO_MESSAGES_AFTER_CLAIM = [
  {
    id: 'm9',
    kind: 'system',
    time: '10:12',
    icon: 'claim',
    text: 'Rafael Lima assumiu · agent pausado · 10:12',
  },
  {
    id: 'm10',
    kind: 'analyst',
    time: '10:12',
    author: 'Rafael Lima',
    team: 'Suporte N2',
    text: 'Oi, Ana! Aqui é o Rafael do Suporte N2. Vi que o chamado do notebook está parado há 5 dias — vou te ajudar agora. Pode deixar o notebook ligado agora?',
  },
  {
    id: 'm11',
    kind: 'employee',
    time: '10:13',
    text: 'Posso sim, está ligado.',
  },
] as const satisfies readonly AnalystChatMessage[];

export const DEMO_ANALYST_CHAT = {
  employee: {
    name: 'Ana Souza',
    initials: 'AS',
    metaWaiting: 'online · Financeiro · INC-20311',
    metaClaimed: 'online · Financeiro',
    firstName: 'Ana',
  },
  waitingUntil: '12:05',
  draftMessage:
    'Ótimo! Vou iniciar o acesso remoto, é só aceitar o pedido que vai aparecer na tela',
  messagesWaiting: DEMO_MESSAGES_WAITING,
  /** Transcript completo após Assumir (waiting + claim + reply). */
  messagesClaimed: [...DEMO_MESSAGES_WAITING, ...DEMO_MESSAGES_AFTER_CLAIM] as AnalystChatMessage[],
} as const;

export type AnalystTicketTone = 'waiting' | 'progress' | 'approved' | 'resolved';

export type AnalystTicketListItem = {
  id: string;
  title: string;
  meta: string;
  tone: AnalystTicketTone;
};

const DEMO_TICKET_OTHERS = [
  {
    id: 't1',
    title: 'Acesso à pasta Financeiro',
    meta: 'INC-20298 · Em andamento',
    tone: 'progress',
  },
  {
    id: 't2',
    title: 'Segundo monitor para home office',
    meta: 'REQ-10442 · Aprovado',
    tone: 'approved',
  },
  {
    id: 't3',
    title: 'Outlook não sincroniza no celular',
    meta: 'INC-19877 · Resolvido em 02 set',
    tone: 'resolved',
  },
  {
    id: 't4',
    title: 'Troca de senha da rede',
    meta: 'INC-19410 · Resolvido em 11 jul',
    tone: 'resolved',
  },
] as const satisfies readonly AnalystTicketListItem[];

export const DEMO_ANALYST_TICKETS = {
  firstName: 'Ana',
  openCount: 3,
  closedCount: 2,
  others: DEMO_TICKET_OTHERS,
  currentWaiting: {
    number: 'INC-20311',
    title: 'Notebook lento após atualização',
    statusLabel: 'Aguardando analista',
    statusTone: 'waiting' as const,
    meta: 'Hardware · prioridade média',
    eventLabel: 'Transferido para um analista',
    eventTime: '10:05',
    eventIcon: 'transfer' as const,
  },
  currentClaimed: {
    number: 'INC-20311',
    title: 'Notebook lento após atualização',
    statusLabel: 'Em atendimento',
    statusTone: 'progress' as const,
    meta: 'Hardware · prioridade média',
    eventLabel: 'Assumido por Rafael Lima',
    eventTime: '10:12',
    eventIcon: 'claim' as const,
  },
} as const;
