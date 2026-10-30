/**
 * Contexto das tools do agent **por request** (AsyncLocalStorage).
 * Evita o singleton global que misturava employeeId entre requests concorrentes.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { AgentToolContext } from '@/agent/tools/tool-context';

const storage = new AsyncLocalStorage<AgentToolContext>();

export function getAgentToolContext(): AgentToolContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('Agent tool context not bound for this request');
  }
  return ctx;
}

export function runWithAgentToolContext<T>(
  ctx: AgentToolContext,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(ctx, fn);
}
