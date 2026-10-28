import { NexoLogo } from '@/components/brand/NexoLogo';
import { BrokenLines } from '@/components/ui/BrokenLines';
import { Typography } from '@/components/ui/Typography';
import {
  LOGIN_CHAT_ASSISTANT_MESSAGE,
  LOGIN_CHAT_OFFSET,
  LOGIN_CHAT_STATUS_REST,
  LOGIN_CHAT_TICKET,
  LOGIN_CHAT_USER_MESSAGE,
  LOGIN_DESCRIPTION_LAST,
  LOGIN_DESCRIPTION_LINES,
  LOGIN_HEADLINE_LINES,
  LOGIN_STATS,
} from '@/components/auth/login-layout';

/** Slot superior esquerdo — logo brand. */
export function LoginShowcaseTop() {
  return <NexoLogo variant="brand" height={24} />;
}

/**
 * Slot do meio — story + mock de chat.
 * Compacto &lt; 2xl; 2xl (~27″) restaura tipografia e deslocamento.
 */
export function LoginShowcase() {
  return (
    <div className="w-full">
      <Typography font="schibsted" size={12.5} className="text-[var(--color-text-on-navy-muted)]">
        Service desk de TI da Nexo
      </Typography>

      <Typography
        as="h2"
        font="newsreader"
        size={40}
        weight="medium"
        className="mt-2 text-[var(--color-text-on-navy)] 2xl:mt-3 2xl:text-[54px] 2xl:leading-[1.08]"
      >
        <BrokenLines lines={LOGIN_HEADLINE_LINES} />
      </Typography>

      <Typography
        font="schibsted"
        size={16}
        className="mt-2 text-[var(--color-text-on-navy-muted)] 2xl:mt-4"
      >
        <BrokenLines lines={LOGIN_DESCRIPTION_LINES} lastLine={LOGIN_DESCRIPTION_LAST} />
      </Typography>

      <LoginChatPreview />
    </div>
  );
}

/** Slot inferior — métricas (escala tipográfica só em 2xl). */
export function LoginShowcaseBottom() {
  return (
    <div className="border-t border-white/10 pt-3 2xl:pt-6">
      <dl className="grid grid-cols-3 divide-x divide-white/10">
        {LOGIN_STATS.map((stat, index) => (
          <div key={stat.label} className={`min-w-0 ${index === 0 ? 'pr-4' : 'px-4'}`}>
            <Typography
              as="dt"
              font="newsreader"
              size={22}
              weight="medium"
              className="flex items-center gap-1.5 text-[var(--color-text-on-navy)] 2xl:text-[32px] 2xl:leading-none"
            >
              {stat.value}
              {stat.online ? (
                <span
                  className="size-2 rounded-full bg-[var(--color-success)] 2xl:size-2.5"
                  aria-label="online"
                />
              ) : null}
            </Typography>
            <Typography
              as="dd"
              font="schibsted"
              size={12}
              className="mt-1 text-[var(--color-text-on-navy-muted)] 2xl:mt-1.5 2xl:text-[14px]"
            >
              {stat.label}
            </Typography>
          </div>
        ))}
      </dl>
    </div>
  );
}

const BUBBLE_USER =
  'whitespace-nowrap rounded-2xl rounded-br-[2px] bg-white px-3.5 py-2 text-[13.5px] leading-snug text-[var(--color-text)] 2xl:py-2.5';

const BUBBLE_ASSISTANT =
  'max-w-[92%] rounded-2xl rounded-bl-md bg-[#2f3c4d] px-3.5 py-2 text-[13.5px] leading-snug text-[var(--color-text-on-navy)] 2xl:py-2.5';

function LoginChatPreview() {
  return (
    <div
      className={`${LOGIN_CHAT_OFFSET} rounded-2xl border border-white/10 bg-[#243040] py-3 pr-3 pl-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.28)] 2xl:py-5 2xl:pr-5`}
    >
      <div className="flex justify-end">
        <p className={BUBBLE_USER}>{LOGIN_CHAT_USER_MESSAGE}</p>
      </div>

      <p className="mt-2 text-[11.5px] text-[var(--color-text-on-navy-muted)] 2xl:mt-3">
        <span className="text-[var(--color-text-on-navy)]">Nexo Assist</span>{' '}
        {LOGIN_CHAT_STATUS_REST}
      </p>

      <div className="mt-1.5 flex justify-start 2xl:mt-2">
        <p className={BUBBLE_ASSISTANT}>{LOGIN_CHAT_ASSISTANT_MESSAGE}</p>
      </div>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] text-[var(--color-text)] 2xl:mt-3 2xl:py-1.5">
        <span className="size-2 shrink-0 rounded-full bg-[#e6b422]" aria-hidden />
        <span>{LOGIN_CHAT_TICKET}</span>
      </div>
    </div>
  );
}
