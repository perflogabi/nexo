'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Typography } from '@/components/ui/Typography';

type Props = {
  label: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'id'> & {
    id?: string;
  };

/**
 * Checkbox reutilizável — accent primary + tipografia Schibsted 15.5.
 */
export function Checkbox({ label, className = '', id: idProp, ...rest }: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <label htmlFor={id} className={`flex cursor-pointer items-center gap-2.5 ${className}`.trim()}>
      <input
        id={id}
        type="checkbox"
        className="size-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
        {...rest}
      />
      <Typography as="span" font="schibsted" size={15.5} className="text-[var(--color-text)]">
        {label}
      </Typography>
    </label>
  );
}
