/**
 * Eventos só do console do analista — não devem aparecer no /chat do funcionário.
 */

export function isAnalystOnlySystemMessage(message: {
  authorType: string;
  content: string;
  structuredPayload?: unknown | null;
}): boolean {
  if (message.authorType !== 'SYSTEM') return false;

  const payload = message.structuredPayload;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { type?: string }).type === 'analyst_claim'
  ) {
    return true;
  }

  const text = message.content.trim().toLowerCase();
  return text.startsWith('assumido por você') || text.startsWith('assumido por voce');
}

export function filterEmployeeVisibleMessages<
  T extends { authorType: string; content: string; structuredPayload?: unknown | null },
>(messages: T[]): T[] {
  return messages.filter((m) => !isAnalystOnlySystemMessage(m));
}
