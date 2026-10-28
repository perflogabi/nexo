import { Button } from '@/components/ui/Button';
import { IconKey, IconLock, IconMail, IconRefresh } from '@/components/ui/icons';

export type EmployeeProfileData = {
  name: string;
  email: string;
  /** Dias desde a última alteração de senha (demo/stub visual). */
  passwordChangedDaysAgo: number;
};

type Props = {
  profile: EmployeeProfileData;
  className?: string;
};

/**
 * Conteúdo de Meu perfil — cards somente leitura + stub “Redefinir senha”.
 * Referência: Cliente — Meu perfil (desktop).
 */
export function EmployeeProfilePanel({ profile, className = '' }: Props) {
  return (
    <div
      className={[
        'font-ui mx-auto w-full min-w-0 max-w-[640px] px-6 py-8 xl:max-w-[680px] 2xl:py-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--color-text)] 2xl:text-[32px]">
          Meu perfil
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--color-text-muted)]">
          Seus dados de acesso ao service desk de TI.
        </p>
      </header>

      <section
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white"
        aria-label="Dados pessoais"
      >
        {/* Label | valor alinhados em coluna; badge TI à direita só no e-mail */}
        <div className="grid grid-cols-[9.75rem_minmax(0,1fr)_auto] items-center gap-x-5 px-5 py-4">
          <span className="text-[13px] text-[var(--color-text-muted)]">Nome</span>
          <span className="min-w-0 text-[14px] font-semibold text-[var(--color-text)]">
            {profile.name}
          </span>
          <span aria-hidden className="w-0" />
        </div>
        <div className="border-t border-[var(--color-border)]" />
        <div className="grid grid-cols-[9.75rem_minmax(0,1fr)_auto] items-center gap-x-5 px-5 py-4">
          <span className="text-[13px] text-[var(--color-text-muted)]">E-mail corporativo</span>
          <span className="min-w-0 truncate text-[14px] font-semibold text-[var(--color-text)]">
            {profile.email}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
            <IconLock className="size-3.5" />
            Gerenciado pela TI
          </span>
        </div>
      </section>

      <section
        className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white"
        aria-label="Senha"
      >
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]">
            <IconKey className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[var(--color-text)]">Senha</p>
            <p className="text-[12.5px] text-[var(--color-text-muted)]">
              Alterada há {profile.passwordChangedDaysAgo} dias
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-auto shrink-0"
            /* Stub visual — sem reset real (design-system / PRD). */
          >
            <span className="inline-flex items-center gap-1.5">
              <IconRefresh className="size-3.5" />
              Redefinir senha
            </span>
          </Button>
        </div>
        <div className="flex items-start gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-5 py-3.5">
          <IconMail className="mt-0.5 size-3.5 shrink-0 text-[var(--color-text-muted)]" />
          <p className="text-[12.5px] leading-snug text-[var(--color-text-muted)]">
            Enviaremos um link de redefinição para {profile.email}.
          </p>
        </div>
      </section>
    </div>
  );
}
