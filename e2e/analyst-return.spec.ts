import { test, expect } from '@playwright/test';
import {
  analystClaim,
  analystMessage,
  analystReturn,
  createConversation,
  getConversation,
  postMessage,
} from './helpers/api';
import { loginApiContext } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E5a return', () => {
  test('assumir → mensagem → devolver ao agent', async () => {
    const marker = uniqueMarker('ret');
    const emp = await loginApiContext('fabio.nunes@nexo.com.br');
    const analyst = await loginApiContext('analista@nexo.local');
    try {
      const conv = await createConversation(emp);
      await postMessage(emp, conv.id, `Quero falar com um analista ${marker}`);

      expect((await analystClaim(analyst, conv.id)).status).toBe(200);
      expect((await analystMessage(analyst, conv.id, `Olá, analista aqui ${marker}`)).status).toBe(
        201,
      );

      const detailMid = await getConversation(emp, conv.id);
      expect(detailMid.messages.some((m) => m.content.includes(marker))).toBe(true);
      expect(detailMid.conversation.status).toBe('WITH_ANALYST');

      expect((await analystReturn(analyst, conv.id)).status).toBe(200);
      const detail = await getConversation(emp, conv.id);
      expect(detail.conversation.status).toBe('WITH_AGENT');
    } finally {
      await emp.dispose();
      await analyst.dispose();
    }
  });
});
