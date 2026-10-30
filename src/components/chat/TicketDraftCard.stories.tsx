import type { Meta, StoryObj } from '@storybook/react';
import { TicketDraftCard } from '@/components/chat/TicketDraftCard';

const meta = {
  title: 'chat/TicketDraftCard',
  component: TicketDraftCard,
  parameters: { layout: 'padded' },
  args: {
    headerLabel: 'Novo chamado • Rascunho',
    title: 'VPN corporativa não conecta',
    description:
      'Após a atualização do cliente, a conexão fica em “conectando…” e cai em ~30s. Já reiniciei o notebook.',
    meta: {
      type: 'Incidente',
      category: 'Rede › VPN',
      priority: 'Alta',
    },
    onConfirm: () => undefined,
    onEdit: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof TicketDraftCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Confirming: Story = {
  args: { confirming: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
