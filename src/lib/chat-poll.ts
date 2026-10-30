'use client';

import { useEffect, useRef } from 'react';

/** Intervalo de poll funcionário ↔ analista (Vercel-friendly; sem WebSocket). */
export const CHAT_POLL_INTERVAL_MS = 3_000;

/**
 * Executa `onTick` imediatamente ao habilitar e depois em intervalo.
 * Não sobrepõe ticks (pula se o anterior ainda estiver rodando).
 */
export function useChatPoll(
  enabled: boolean,
  onTick: () => void | Promise<void>,
  intervalMs: number = CHAT_POLL_INTERVAL_MS,
): void {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    const run = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        await onTickRef.current();
      } catch {
        /* rede / 401 — próximo tick tenta de novo */
      } finally {
        inFlight = false;
      }
    };

    void run();
    const id = window.setInterval(() => void run(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, intervalMs]);
}
