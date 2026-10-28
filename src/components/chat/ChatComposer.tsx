'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

type Props = {
  messageCount: number;
  messageLimit?: number;
  placeholder?: string;
  disabled?: boolean;
  onSend?: (text: string) => void;
  className?: string;
};

/**
 * Composer — barra cápsula + Enviar inset (anexo Composer Area).
 * O Button base é `w-auto`; aqui o Enviar fica à direita com padding interno.
 */
export function ChatComposer({
  messageCount,
  messageLimit = 30,
  placeholder = 'Escreva para o Nexo...',
  disabled = false,
  onSend,
  className = '',
}: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setValue('');
  }

  return (
    <div className={['font-ui w-full', className].filter(Boolean).join(' ')}>
      <form
        onSubmit={handleSubmit}
        className={[
          'flex h-10 items-center overflow-hidden rounded-[var(--radius-md)]',
          'border border-[var(--color-border)] bg-white',
          'py-1 pr-1 pl-5 shadow-[0_2px_10px_rgba(27,36,48,0.06)]',
        ].join(' ')}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Mensagem"
          className={[
            'min-w-0 flex-1 bg-transparent pr-3 text-[14px] leading-none text-[var(--color-text)]',
            'outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed',
          ].join(' ')}
        />
        <Button
          type="submit"
          size="sm"
          icon="arrowUp"
          disabled={disabled}
          className="h-8 shrink-0 gap-1.5 rounded-[var(--radius-sm)] px-3.5 text-[13px] font-semibold shadow-none"
        >
          Enviar
        </Button>
      </form>
      <p className="mt-1.5 text-right text-[12px] leading-none text-[var(--color-text-muted)]">
        {messageCount}/{messageLimit} mensagens nesta sessão
      </p>
    </div>
  );
}
