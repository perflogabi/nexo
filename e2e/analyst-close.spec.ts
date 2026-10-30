import { test, expect } from '@playwright/test';
import {
  analystClaim,
  analystClose,
  createConversation,
  e2ePrisma,
  getConversation,
  postMessage,
} from './helpers/api';
import { loginApiContext, loginViaUi } from './helpers/auth';
import { uniqueMarker } from './helpers/markers';

test.describe('E5b close', () => {
  test('encerrar → CLOSED, histórico, composer e indicação visual', async ({ page }) => {
    const marker = uniqueMarker('close');
    const email = 'carla.mendes@nexo.com.br';
    const emp = await loginApiContext(email);
    const analyst = await loginApiContext('analista@nexo.local');
    try {
      const conv = await createConversation(emp);
      await postMessage(emp, conv.id, `Quero falar com um analista ${marker}`);
      expect((await analystClaim(analyst, conv.id)).status).toBe(200);
      expect((await analystClose(analyst, conv.id)).status).toBe(200);

      const prisma = e2ePrisma();
      try {
        const row = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
        expect(row.status).toBe('CLOSED');
        // Isola a UI: encerra outras sessões abertas desta funcionária (runs anteriores).
        await prisma.conversation.updateMany({
          where: {
            employeeId: 'emp_carla_mendes',
            id: { not: conv.id },
            status: { in: ['WITH_AGENT', 'WAITING_ANALYST', 'WITH_ANALYST'] },
          },
          data: { status: 'CLOSED', assignedAnalystId: null },
        });
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { updatedAt: new Date() },
        });
      } finally {
        await prisma.$disconnect();
      }

      const detail = await getConversation(emp, conv.id);
      expect(detail.conversation.status).toBe('CLOSED');
      expect(detail.messages.some((m) => m.content.includes(marker))).toBe(true);

      await loginViaUi(page, email);
      await expect(page).toHaveURL(/\/chat/);
      await expect(page.getByTestId('conversation-closed-notice')).toBeVisible({ timeout: 25_000 });
      await expect(page.getByText('Atendimento encerrado')).toBeVisible();
      await expect(page.getByPlaceholder(/escreva/i)).toBeDisabled();
    } finally {
      await emp.dispose();
      await analyst.dispose();
    }
  });
});
