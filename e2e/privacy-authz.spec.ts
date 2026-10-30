import { test, expect } from '@playwright/test';
import {
  createConversation,
  findTicketsByTitleMarker,
  postConfirm,
  postMessage,
} from './helpers/api';
import { loginApiContext } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E6 privacy', () => {
  test('Carla não acessa conversa/ticket de Ana', async () => {
    const marker = uniqueMarker('priv');
    const ana = await loginApiContext('ana.souza@nexo.com.br');
    const carla = await loginApiContext('carla.mendes@nexo.com.br');
    try {
      const conv = await createConversation(ana);
      const draft = await postMessage(
        ana,
        conv.id,
        `Quero abrir um chamado: teclado USB falhou ${marker}`,
      );
      const token = draft.body.agentMessage?.structuredPayload?.confirmationToken as string;
      const confirmed = await postConfirm(ana, conv.id, token);
      expect(confirmed.status).toBe(200);
      const ticketId = confirmed.body.ticket?.id as string;

      const list = await carla.get('/api/conversations');
      expect(list.status()).toBe(200);
      const body = (await list.json()) as { conversations: Array<{ id: string }> };
      expect(body.conversations.some((c) => c.id === conv.id)).toBe(false);

      const msgs = await carla.get(`/api/conversations/${encodeURIComponent(conv.id)}/messages`);
      expect([403, 404]).toContain(msgs.status());

      expect(
        (await findTicketsByTitleMarker(marker, 'emp_ana')).some((t) => t.id === ticketId),
      ).toBe(true);
      expect(await findTicketsByTitleMarker(marker, 'emp_carla_mendes')).toHaveLength(0);
    } finally {
      await ana.dispose();
      await carla.dispose();
    }
  });
});
