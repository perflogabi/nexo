/**
 * Follow-ups do /chat após card de chamado (quick replies e frases curtas).
 */

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** “Não, obrigado” / “ok valeu” — encerra o fio sem reabrir o card. */
export function isPoliteDismiss(text: string): boolean {
  const t = fold(text);
  if (!t) return false;
  if (
    /^(nao|nope|n)$/.test(t) ||
    /^nao[, ]+(obrigad[oa]|precisa|quero|valeu)/.test(t) ||
    /^(nao obrigad[oa]|obrigad[oa]|valeu|ok obrigad[oa]|tudo bem|por agora nao|deixa pra la|deixa para la)$/.test(
      t,
    ) ||
    /^(ok|okay|beleza|tranquilo)$/.test(t)
  ) {
    return true;
  }
  return t.includes('nao obrigad') || t.includes('nao precisa') || t.includes('nao quero');
}

/** Quick reply “Adicionar informação”. */
export function isAddInfoRequest(text: string): boolean {
  const t = fold(text);
  return (
    t.includes('adicionar informacao') ||
    t.includes('adicionar info') ||
    /^mais informacao/.test(t) ||
    /^quero (adicionar|incluir|atualizar)/.test(t)
  );
}

/** Quick reply / pedido explícito de analista humano. */
export function isAnalystRequest(text: string): boolean {
  const t = fold(text);
  if (!t) return false;
  if (/^falar com (um )?analista/.test(t)) return true;
  if (t.includes('falar com um analista') || t.includes('falar com analista')) return true;
  if (t.includes('atendente') || t.includes('humano') || t.includes('pessoa real')) return true;
  if (/\bquero falar com\b/.test(t)) return true;
  if (t.includes('chamar um analista') || t.includes('chame um analista')) return true;
  return false;
}

export const DISMISS_REPLY =
  'Perfeito. Se precisar de algo depois — status de chamado, dica na base de ajuda ou um analista — é só chamar.';

export const ADD_INFO_REPLY =
  'Pode mandar a informação que quer acrescentar (o máximo de detalhes ajuda). Depois eu preparo um rascunho para você confirmar.';

export const ANALYST_TRANSFER_REPLY =
  'Entendi — vou chamar um analista do Suporte N2. Em até 2 h úteis alguém fala com você por aqui.';
