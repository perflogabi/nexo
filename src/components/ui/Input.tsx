'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Typography } from '@/components/ui/Typography';

type Props = {
  label: string;
  /** Ícone à esquerda (envelope, lock, etc.). */
  leadingIcon?: ReactNode;
  /** Conteúdo à direita dentro do campo (ex.: toggle de senha). */
  trailing?: ReactNode;
  /** Link/ação alinhado à direita da label (ex.: “Esqueci minha senha”). */
  labelAction?: ReactNode;
  error?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> & {
    id?: string;
  };

/**
 * Campo de formulário reutilizável — label, ícones e foco primary do design system.
 * Ícone leading: muted em repouso; primary via CSS `:focus-within` quando ativo.
 */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  {
    label,
    leadingIcon,
    trailing,
    labelAction,
    error,
    className = '',
    id: idProp,
    type = 'text',
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <Typography
          as="label"
          htmlFor={id}
          font="schibsted"
          size={15.5}
          weight="medium"
          className="text-[var(--color-text)]"
        >
          {label}
        </Typography>
        {labelAction}
      </div>

      <span className="nexo-input-wrap relative block">
        {leadingIcon ? (
          <span className="nexo-input-leading pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={[
            'h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white',
            'py-2.5 text-[15.5px] text-[var(--color-text)] outline-none transition-colors',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(0,98,196,0.12)]',
            leadingIcon ? 'pl-10' : 'pl-3',
            trailing ? 'pr-10' : 'pr-3',
          ].join(' ')}
          {...rest}
        />
        {trailing ? (
          <span className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[var(--color-text-muted)]">
            {trailing}
          </span>
        ) : null}
      </span>

      {error ? (
        <Typography
          id={errorId}
          font="schibsted"
          size={12.5}
          className="text-[var(--color-danger)]"
        >
          {error}
        </Typography>
      ) : null}
    </div>
  );
});
