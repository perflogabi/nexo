/**
 * Uma conversa por funcionário na lista do console (sem duplicar Ana etc.).
 * Prioridade: atendimento humano / fila > sessão /chat > encerrada.
 * Empate: a mais recente (updatedAt).
 */

export type DedupeConversation = {
  id: string;
  status: string;
  employee: { id: string };
  updatedAt: string | Date;
};

function statusRank(status: string): number {
  switch (status) {
    case 'WITH_ANALYST':
      return 0;
    case 'WAITING_ANALYST':
      return 1;
    case 'WITH_AGENT':
      return 2;
    case 'CLOSED':
      return 3;
    default:
      return 9;
  }
}

function isBetterCandidate(candidate: DedupeConversation, current: DedupeConversation): boolean {
  const rankNew = statusRank(candidate.status);
  const rankPrev = statusRank(current.status);
  if (rankNew !== rankPrev) return rankNew < rankPrev;
  return new Date(candidate.updatedAt).getTime() >= new Date(current.updatedAt).getTime();
}

export function dedupeAnalystConversationsByEmployee<T extends DedupeConversation>(
  conversations: T[],
): T[] {
  const best = new Map<string, T>();
  for (const c of conversations) {
    const key = c.employee.id;
    const prev = best.get(key);
    if (!prev || isBetterCandidate(c, prev)) {
      best.set(key, c);
    }
  }
  return [...best.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
