/**
 * Tokens de layout do login (coluna esquerda).
 * Compacto &lt; 2xl (~15″); 2xl+ (~27″) usa os valores maiores.
 */
export const LOGIN_LEFT_BLOCK = 'w-full max-w-[520px] shrink-0 2xl:max-w-[640px]' as const;

/** Deslocamento + largura do mock de chat (alinhado sob “resolvido”). */
export const LOGIN_CHAT_OFFSET =
  'mt-4 ml-[120px] w-[calc(100%-120px)] 2xl:mt-8 2xl:ml-[160px] 2xl:w-[calc(100%-160px)] 2xl:min-w-[420px]' as const;

export const LOGIN_HEADLINE_LINES = ['Seu problema de TI, resolvido', 'em uma conversa.'] as const;

export const LOGIN_DESCRIPTION_LINES = [
  'Descreva o que está acontecendo. O assistente consulta seus',
  'chamados, busca na central de ajuda e chama um analista quando',
] as const;

export const LOGIN_DESCRIPTION_LAST = 'precisa.';

export const LOGIN_CHAT_USER_MESSAGE = 'Meu notebook não conecta na VPN. Erro 809.';

export const LOGIN_CHAT_STATUS_REST = 'consultou seus chamados · criou um chamado';

export const LOGIN_CHAT_ASSISTANT_MESSAGE =
  'Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.';

export const LOGIN_CHAT_TICKET = 'INC-20517 Rede e VPN · Alta · em até 4\u00a0h';

export type LoginStat = {
  value: string;
  label: string;
  online?: boolean;
};

export const LOGIN_STATS: readonly LoginStat[] = [
  { value: '8 s', label: 'primeira resposta, em média' },
  { value: '72%', label: 'resolvidos sem fila' },
  { value: '6', label: 'analistas online agora', online: true },
];
