import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { title?: string };

/** Ícones oficiais para Button (lado esquerdo do texto em 3 telas). */
export type ButtonIconName = 'arrowUp' | 'headphones' | 'send';

function IconBase({
  title,
  className,
  children,
  viewBox = '0 0 16 16',
  ...rest
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      width={16}
      height={16}
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

export const BUTTON_ICONS = {
  arrowUp: IconArrowUp,
  headphones: IconHeadphones,
  send: IconSend,
} as const;
