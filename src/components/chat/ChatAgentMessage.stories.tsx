import type { Meta, StoryObj } from '@storybook/react';
import { ChatAgentMessage } from '@/components/chat/ChatAgentMessage';
import { DEMO_QUICK_REPLIES } from '@/components/chat/chat-demo-data';

const meta = {
  title: 'chat/ChatAgentMessage',
  component: ChatAgentMessage,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatAgentMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComAcoes: Story = {
  args: {
    actions: DEMO_QUICK_REPLIES,
    children:
      'Está sem atualização há 5 dias, acima do prazo de 3 dias úteis para prioridade média. Quer que eu chame um analista?',
  },
};

export const SoTexto: Story = {
  args: {
    children: 'Você tem 3 chamados abertos. Sobre qual deles quer saber?',
  },
};
