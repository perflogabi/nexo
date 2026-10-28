import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { title?: string };

/** Ícones oficiais para Button (lado esquerdo do texto em 3 telas). */
export type ButtonIconName = 'arrowUp' | 'headphones' | 'send';

function IconBase({
  title,
  className,
  children,
  viewBox = '0 0 16 16',
  width = 16,
  height = 16,
  ...rest
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={['shrink-0', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Seta para cima (anexo Icon). */
export function IconArrowUp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M8 12.5V3.5M8 3.5 4.5 7M8 3.5 11.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Headphones (anexo Icon 1). */
export function IconHeadphones(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 9.5V8a5 5 0 0 1 10 0v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="2" y="9" width="3" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="9" width="3" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

/** Enviar / seta geométrica à direita (anexo Icon 2). */
export function IconSend(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 3.5 13 8 3 12.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </IconBase>
  );
}

/** Envelope (Input e-mail). */
export function IconMail(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
    </IconBase>
  );
}

/** Cadeado (Input senha). */
export function IconLock(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </IconBase>
  );
}

/** Olho (toggle senha). */
export function IconEye(props: IconProps) {
  return (
    <IconBase viewBox="0 0 24 24" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </IconBase>
  );
}

/** Seta → do CTA “Entrar”. */
export function IconArrowRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 8h10M9 4.5 12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Bolha de chat — nav “Atendimento” (anexo Icon 3). */
export function IconNavChat(props: IconProps) {
  return (
    <IconBase viewBox="0 0 15 14" width={15} height={14} {...props}>
      <path
        d="M1.2 1.1h12.6a1 1 0 0 1 1 1v7.2a1 1 0 0 1-1 1H5.2L1.5 13.2V2.1a1 1 0 0 1 .97-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Perfil — nav “Meu perfil” (anexo Icon 4). */
export function IconNavProfile(props: IconProps) {
  return (
    <IconBase viewBox="0 0 12 14" width={12} height={14} {...props}>
      <circle cx="6" cy="3.6" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.2 12.6c.4-2.6 2.2-4 4.8-4s4.4 1.4 4.8 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

/** Lupa — busca da lista Conversas (console analista). */
export function IconSearch(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

/** Duplo check — preview “Nexo: …” na lista. */
export function IconDoubleCheck(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M1.5 8.5 3.5 10.5 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8.5 7.5 10.5 13.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Check — chips de ação do agent (“✓ consultou…”). */
export function IconCheck(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Menu ⋮ — header do chat analista. */
export function IconMoreVertical(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

/** Fechar — painel de chamados. */
export function IconClose(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

/** Chevron → — itens de outros chamados. */
export function IconChevronRight(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Chevron ← — voltar (mobile master-detail). */
export function IconChevronLeft(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Chevron ↓ — mais mensagens abaixo no transcript. */
export function IconChevronDown(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M3.5 6 8 10.5 12.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Ticket / chamado — abrir painel em viewport estreita. */
export function IconTicket(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M3 4.5h10a1 1 0 0 1 1 1V7a1.5 1.5 0 0 0 0 2v1.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1.5 1.5 0 0 0 0-2V5.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 4.5v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1.5 2"
      />
    </IconBase>
  );
}

/** Transferência ↔ — evento / card desta conversa. */
export function IconTransfer(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M2.5 5.5h9M9 3l2.5 2.5L9 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 10.5h-9M7 8l-2.5 2.5L7 13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Bot / agent — badge Aguardando · Devolver ao agent. */
export function IconBot(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <rect x="3" y="5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="2.5" r="0.9" fill="currentColor" />
      <circle cx="5.8" cy="8.5" r="1" fill="currentColor" />
      <circle cx="10.2" cy="8.5" r="1" fill="currentColor" />
    </IconBase>
  );
}

/** Mão / espera — “Ana espera um atendente”. */
export function IconHand(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M5.5 7.5V4.2a1 1 0 0 1 2 0V7M7.5 7V3.5a1 1 0 0 1 2 0V7M9.5 7.2V4.5a1 1 0 0 1 2 0v5.2c0 2-1.5 3.8-3.5 3.8H8A3.5 3.5 0 0 1 4.5 9.5V8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Seta ↗ — Ver todos os chamados. */
export function IconExternalLink(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M6.5 3.5H12.5V9.5M12.5 3.5 4.5 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

/** Sair — rodapé do sidebar. */
export function IconLogout(props: IconProps) {
  return (
    <IconBase viewBox="0 0 16 16" {...props}>
      <path
        d="M6 2.5H3.5A1.5 1.5 0 0 0 2 4v8a1.5 1.5 0 0 0 1.5 1.5H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.5 8H14M11 5l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export const BUTTON_ICONS = {
  arrowUp: IconArrowUp,
  headphones: IconHeadphones,
  send: IconSend,
} as const;
