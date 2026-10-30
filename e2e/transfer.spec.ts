import { test, expect } from '@playwright/test';
import { createConversation, getConversation, postMessage } from './helpers/api';
import { loginApiContext } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E4 transfer', () => {
  test('pedido de analista → WAITING_ANALYST e agent não responde', async () => {
    const marker = uniqueMarker('xfer');
    const ctx = await loginApiContext('bruno.tavares@nexo.com.br');
    try {
      const conv = await createConversation(ctx);
      const transfer = await postMessage(
        ctx,
        conv.id,
        `Quero falar com um analista sobre ${marker}`,
      );
      expect(transfer.status).toBe(201);
      expect(transfer.body.conversation?.status).toBe('WAITING_ANALYST');

      const second = await postMessage(ctx, conv.id, `ainda aguardando ${marker}`);
      expect(second.status).toBe(201);
      expect(second.body.agentMessage).toBeNull();

      const detail = await getConversation(ctx, conv.id);
      expect(detail.conversation.status).toBe('WAITING_ANALYST');
      expect(detail.messages[detail.messages.length - 1]?.authorType).toBe('EMPLOYEE');
    } finally {
      await ctx.dispose();
    }
  });
});
