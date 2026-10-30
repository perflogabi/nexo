'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { IconEye, IconLock, IconMail } from '@/components/ui/icons';
import { Typography } from '@/components/ui/Typography';

type Props = {
  defaultEmail?: string;
  onSubmit: (input: { email: string; password: string; keepSignedIn: boolean }) => Promise<void>;
};

/**
 * Formulário Sign In — tipografia, Input, Checkbox e Button do design system.
 * Sem e-mail demo pré-preenchido (campo inicia vazio).
 */
export function LoginForm({ defaultEmail = '', onSubmit }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ email, password, keepSignedIn });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="font-ui flex w-full flex-col gap-4 sm:gap-5">
      <div>
        <Typography
          as="h1"
          font="newsreader"
          size={40}
          weight="medium"
          className="text-[var(--color-text)] max-sm:text-[34px]"
        >
          Entrar
        </Typography>
        <Typography
          font="schibsted"
          size={15.5}
          className="mt-2 text-[var(--color-text-muted)] max-sm:text-[14px] sm:mt-2.5"
        >
          Use seu e-mail corporativo e a senha da rede Nexo.
        </Typography>
      </div>

      <Input
        label="E-mail corporativo"
        type="email"
        required
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nome.sobrenome@nexo.com.br"
        leadingIcon={<IconMail />}
      />

      <Input
        id="password"
        label="Senha"
        type={showPassword ? 'text' : 'password'}
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leadingIcon={<IconLock />}
        labelAction={
          <button
            type="button"
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
          >
            Esqueci minha senha
          </button>
        }
        trailing={
          <button
            type="button"
            className="flex items-center text-[var(--color-text-muted)]"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <IconEye />
          </button>
        }
      />

      <Checkbox
        label="Manter conectado neste computador"
        checked={keepSignedIn}
        onChange={(e) => setKeepSignedIn(e.target.checked)}
        className="gap-2 whitespace-nowrap [&_span]:!text-[13px] [&_span]:!leading-none"
      />

      {error ? (
        <Typography font="schibsted" size={15.5} className="text-[var(--color-danger)]">
          {error}
        </Typography>
      ) : null}

      <Button type="submit" size="md" iconEnd="arrow" disabled={loading} className="mt-0.5 w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>

      {/* Divisor do asset Sign In, abaixo do CTA */}
      <div className="mt-1 border-t border-[var(--color-border)]" aria-hidden />
    </form>
  );
}
