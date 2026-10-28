import type { Meta, StoryObj } from '@storybook/react';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';

const meta = {
  title: 'analyst/AnalystTicketsPanel',
  component: AnalystTicketsPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-[720px] justify-end bg-[var(--color-bg-chat-console)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnalystTicketsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aguardando: Story = {};

export const EmAtendimento: Story = {
  args: { claimed: true },
};
