import { describe, expect, it } from 'vitest';
import { createInMemoryHelpCenter } from '@/services/help-center';

describe('HelpCenterService', () => {
  const service = createInMemoryHelpCenter([
    {
      id: '1',
      slug: 'vpn-erro-809',
      title: 'VPN — erro 809',
      body: 'Reinicie o cliente VPN.',
      tags: ['vpn', '809'],
    },
    {
      id: '2',
      slug: 'horario-service-desk',
      title: 'Horário do service desk',
      body: 'Segunda a sexta, 8h às 18h.',
      tags: ['horario'],
    },
  ]);

  it('searches by title/tags/slug', async () => {
    const hits = await service.search('809');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.slug).toBe('vpn-erro-809');
  });

  it('gets by slug', async () => {
    await expect(service.getBySlug('horario-service-desk')).resolves.toMatchObject({
      title: 'Horário do service desk',
    });
    await expect(service.getBySlug('missing')).resolves.toBeNull();
  });
});
