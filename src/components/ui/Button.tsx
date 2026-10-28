'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { BUTTON_ICONS, IconArrowRight, type ButtonIconName } from '@/components/ui/icons';

export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  children: ReactNode;
  /** Tamanho visual do botão (altura + tipografia). */
  size?: ButtonSize;
  /** Ícone à esquerda do texto (3 telas do protótipo). */
  icon?: ButtonIconName;
  /**
   * Conteúdo à direita do texto.
   * `arrow` = seta → do CTA “Entrar” no login.
   */
  iconEnd?: 'arrow' | ReactNode;
  /** Variante visual. */
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-11 gap-2 px-4 text-[15.5px]',
  lg: 'h-12 gap-2 px-5 text-[16px]',
};

const VARIANT_CLASS = {
  primary:
    'bg-[var(--color-primary)] text-white shadow-[0_1px_2px_rgba(0,98,197,0.35)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]',
  ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)]',
} as const;

/**
 * Botão reutilizável — texto e tamanho dinâmicos; ícone esquerdo e/ou seta à direita.
 */
export function Button({
  children,
  size = 'md',
  icon,
  iconEnd,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  ...rest
}: Props) {
  const Icon = icon ? BUTTON_ICONS[icon] : null;
  const end = iconEnd === 'arrow' ? <IconArrowRight className="size-4" /> : (iconEnd ?? null);

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'font-ui inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {Icon ? <Icon className="size-4" /> : null}
      <span>{children}</span>
      {end}
    </button>
  );
}
