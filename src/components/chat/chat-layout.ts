/**
 * Largura da coluna (messages + composer alinhados).
 * Desktop menor (~15″): 560–640 · 2xl (~27″): bem mais larga, sem wall-of-text.
 */
export const CHAT_COLUMN_WIDTH =
  'mx-auto w-full min-w-0 max-w-[560px] xl:max-w-[640px] 2xl:max-w-[1080px]' as const;

/**
 * Coluna do thread — compacta em desktop menor; folgada em 2xl+.
 * `min-w-0` evita fieldset/linhas longas estourarem a largura dos irmãos.
 */
export const CHAT_COLUMN = `${CHAT_COLUMN_WIDTH} flex flex-col` as const;

/** Gaps entre mensagens. */
export const CHAT_THREAD_GAP = 'gap-2.5 2xl:gap-3.5' as const;

/** Padding da área de mensagens — topo curto; base com folga até o composer. */
export const CHAT_SCROLL_PAD =
  'px-4 pt-2 pb-4 xl:px-6 xl:pt-2.5 xl:pb-5 2xl:pt-3 2xl:pb-6' as const;

/**
 * Padding do composer — mais espaço acima (separar das mensagens);
 * folga embaixo para não grudar na borda da janela.
 */
export const CHAT_COMPOSER_PAD =
  'px-4 pt-4 pb-5 xl:px-6 xl:pt-5 xl:pb-6 2xl:pt-6 2xl:pb-8' as const;

/**
 * Shell das bolhas/cards do agent — 100% da coluna.
 * `min-w-0` + `max-w-full` neutraliza min-content de fieldset/flex.
 */
export const CHAT_AGENT_SURFACE =
  'box-border w-full min-w-0 max-w-full self-stretch rounded-[var(--radius-lg)] rounded-tl-[2px] border border-[var(--color-border)] bg-white' as const;

/**
 * Bolhas de texto / Agent Message (CTAs) — ~3/4 da coluna (folga à direita
 * proporcional, como o offset relativo do mock de chat no login).
 */
export const CHAT_AGENT_BUBBLE =
  'box-border w-3/4 max-w-3/4 min-w-0 self-start rounded-[var(--radius-lg)] rounded-tl-[2px] border border-[var(--color-border)] bg-white' as const;
