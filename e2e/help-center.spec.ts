import { test, expect } from '@playwright/test';
import { createConversation, findTicketsByTitleMarker, postMessage } from './helpers/api';
import { loginApiContext } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E2 help center', () => {
  test('VPN 809 responde sem criar chamado do fluxo', async () => {
    const marker = uniqueMarker('help');
    const ctx = await loginApiContext('gabriela.rocha@nexo.com.br');
    try {
      const conv = await createConversation(ctx);
      const { status, body } = await postMessage(
        ctx,
        conv.id,
        `Erro 809 de VPN no Windows 11 — só consulta help ${marker}`,
      );
      expect(status).toBe(201);
      const agentText = String(body.agentMessage?.content ?? '');
      expect(agentText.length).toBeGreaterThan(10);
      expect(body.agentMessage?.structuredPayload?.type).not.toBe('ticket_draft');
      expect(await findTicketsByTitleMarker(marker)).toHaveLength(0);
    } finally {
      await ctx.dispose();
    }
  });
});
