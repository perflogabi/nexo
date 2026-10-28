import type { ReactNode } from 'react';
import {
  LoginShowcase,
  LoginShowcaseBottom,
  LoginShowcaseTop,
} from '@/components/auth/LoginShowcase';
import { LOGIN_LEFT_BLOCK } from '@/components/auth/login-layout';
import { Typography } from '@/components/ui/Typography';

type Props = {
  form: ReactNode;
};

/**
 * Login split:
 * - 2 colunas (navy | branco), cada uma com 3 slots
 * - esquerda: logo · story (centro) · métricas — mesma largura centralizada
 * - compacto &lt; 2xl; 2xl+ (~27″) com mais respiro
 */
export function LoginSplitLayout({ form }: Props) {
  return (
    <div className="font-ui flex h-svh min-h-svh overflow-hidden">
      <div className="hidden h-full w-[56%] flex-col items-center overflow-hidden bg-[var(--color-navy)] px-8 py-5 lg:flex 2xl:px-14 2xl:py-10">
        <div className={LOGIN_LEFT_BLOCK}>
          <LoginShowcaseTop />
        </div>

        <div
          className={`flex min-h-0 flex-1 flex-col justify-center py-3 2xl:py-8 ${LOGIN_LEFT_BLOCK}`}
        >
          <LoginShowcase />
        </div>

        <div className={LOGIN_LEFT_BLOCK}>
          <LoginShowcaseBottom />
        </div>
      </div>

      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white lg:w-[44%]">
        <div className="flex shrink-0 justify-end px-6 pt-5 sm:px-8 lg:px-8 2xl:px-10 2xl:pt-7">
          <Typography
            as="p"
            font="schibsted"
            size={12.5}
            className="text-[var(--color-text-muted)]"
          >
            Problema para entrar?{' '}
            <a className="font-medium text-[var(--color-primary)] hover:underline" href="tel:4000">
              Ligue no ramal 4000
            </a>
          </Typography>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-10 py-6 lg:px-12 2xl:px-14 2xl:py-10">
          <div className="w-full max-w-[270px] xl:max-w-[320px] 2xl:max-w-[380px]">{form}</div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-10 pb-5 pt-1 lg:px-12 2xl:px-14 2xl:pb-8">
          <Typography font="schibsted" size={12} className="text-[var(--color-text-muted)]">
            © 2026 Nexo · Service desk de TI
          </Typography>
          <Typography as="span" font="schibsted" size={12}>
            <a
              href="#privacidade"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Privacidade e uso de dados
            </a>
          </Typography>
        </div>
      </div>
    </div>
  );
}
