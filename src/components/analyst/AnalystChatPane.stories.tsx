import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AnalystChatPane } from '@/components/analyst/AnalystChatPane';

const meta = {
  title: 'analyst/AnalystChatPane',
  component: AnalystChatPane,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnalystChatPane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aguardando: Story = {};

export const Assumido: Story = {
  render: function AssumidoStory() {
    const [claimed, setClaimed] = useState(true);
    return (
      <AnalystChatPane
        claimed={claimed}
        onClaim={() => setClaimed(true)}
        onReturn={() => setClaimed(false)}
      />
    );
  },
};
