import type { ElementType, HTMLAttributes, ReactNode } from 'react';

/** Famílias oficiais do design system. */
export type TypographyFont = 'newsreader' | 'schibsted';

/**
 * Tamanhos tipográficos documentados (login) + escala UI compartilhada.
 * Newsreader: 54 / 46 (headline), 40 (Entrar), 22 (métricas), 13.5 (legado).
 * Schibsted: 16 (descrição esquerda), 15.5 (form/botão), 12.5 / 12 (meta).
 */
export type TypographySize = 54 | 46 | 40 | 22 | 16 | 15.5 | 13.5 | 12.5 | 12;

type Props = {
  children: ReactNode;
  font?: TypographyFont;
  size?: TypographySize;
  as?: ElementType;
  className?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Para `as="label"`. */
  htmlFor?: string;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>;

const SIZE_CLASS: Record<TypographySize, string> = {
  54: 'text-[54px] leading-[1.08] tracking-[-0.02em]',
  46: 'text-[46px] leading-[1.08] tracking-[-0.02em]',
  40: 'text-[40px] leading-none tracking-[-0.02em]',
  22: 'text-[22px] leading-none tracking-[-0.01em]',
  16: 'text-[16px] leading-snug',
  15.5: 'text-[15.5px] leading-snug',
  13.5: 'text-[13.5px] leading-none',
  12.5: 'text-[12.5px] leading-snug',
  12: 'text-[12px] leading-snug',
};

const WEIGHT_CLASS = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

const FONT_CLASS: Record<TypographyFont, string> = {
  newsreader: 'font-display',
  schibsted: 'font-ui',
};

/**
 * Tipografia reutilizável — Newsreader (display) + Schibsted Grotesk (UI).
 */
export function Typography({
  children,
  font = 'schibsted',
  size = 15.5,
  as: Tag = 'p',
  className = '',
  weight = 'regular',
  htmlFor,
  ...rest
}: Props) {
  return (
    <Tag
      className={[FONT_CLASS[font], SIZE_CLASS[size], WEIGHT_CLASS[weight], className]
        .filter(Boolean)
        .join(' ')}
      htmlFor={htmlFor}
      {...rest}
    >
      {children}
    </Tag>
  );
}
