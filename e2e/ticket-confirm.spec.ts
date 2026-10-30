import { test, expect } from '@playwright/test';
import {
  createConversation,
  findTicketsByTitleMarker,
  postConfirm,
  postMessage,
} from './helpers/api';
import { loginApiContext, loginViaUi } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E3 ConfirmationGate', () => {
  test('cancelar não cria; confirmar 1×; reuse não cria; persiste e consulta', async ({ page }) => {
    const marker = uniqueMarker('tkt');
    const email = 'ana.souza@nexo.com.br';
    const ctx = await loginApiContext(email);
    try {
      const conv = await createConversation(ctx);
      const open = await postMessage(
        ctx,
        conv.id,
        `Quero abrir um chamado: impressora laser não imprime duplex ${marker}`,
      );
      expect(open.status).toBe(201);
      const token = open.body.agentMessage?.structuredPayload?.confirmationToken as
        string | undefined;
      expect(token).toBeTruthy();
      expect(open.body.agentMessage?.structuredPayload?.type).toBe('ticket_draft');
      expect(await findTicketsByTitleMarker(marker, 'emp_ana')).toHaveLength(0);

      // Cancelar = não confirmar o primeiro token
      expect(await findTicketsByTitleMarker(marker, 'emp_ana')).toHaveLength(0);

      const again = await postMessage(
        ctx,
        conv.id,
        `Quero abrir um chamado: impressora laser não imprime duplex ${marker}`,
      );
      const token2 = again.body.agentMessage?.structuredPayload?.confirmationToken as string;
      expect(token2).toBeTruthy();

      const confirmed = await postConfirm(ctx, conv.id, token2);
      expect(confirmed.status).toBe(200);
      expect(confirmed.body.ticket?.title).toContain(marker);
      expect(await findTicketsByTitleMarker(marker, 'emp_ana')).toHaveLength(1);

      const reuse = await postConfirm(ctx, conv.id, token2);
      expect(reuse.status).toBe(409);
      expect(await findTicketsByTitleMarker(marker, 'emp_ana')).toHaveLength(1);

      await loginViaUi(page, email);
      await expect(page).toHaveURL(/\/chat/);
      await page.reload();
      await page.getByPlaceholder(/escreva/i).fill('Qual o status do meu chamado?');
      await page.getByRole('button', { name: 'Enviar' }).click();
      await expect(page.getByRole('heading', { name: new RegExp(marker) }).first()).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await ctx.dispose();
    }
  });
});
