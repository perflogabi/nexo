import { NexoLogo } from '@/components/brand/NexoLogo';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { Typography } from '@/components/ui/Typography';

type Props = {
  title: string;
  description?: string;
};

/**
 * Stub pós-login enquanto as próximas telas não são implementadas.
 * Escopo atual: apenas /login + componentes UI base.
 */
export function ComingSoon({ title, description }: Props) {
  return (
    <main className="font-ui flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg-subtle)] px-6">
      <NexoLogo variant="app" height={22} />
      <div className="max-w-md text-center">
        <Typography
          as="h1"
          font="newsreader"
          size={40}
          weight="medium"
          className="text-[var(--color-text)]"
        >
          {title}
        </Typography>
        <Typography font="schibsted" size={15.5} className="mt-3 text-[var(--color-text-muted)]">
          {description ??
            'Esta tela será implementada na próxima etapa, reutilizando Typography e Button.'}
        </Typography>
      </div>
      <div className="w-full max-w-[220px]">
        <LogoutButton />
      </div>
    </main>
  );
}
