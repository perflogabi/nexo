import type { Meta, StoryObj } from '@storybook/react';
import { ConversationList } from '@/components/analyst/ConversationList';

const meta = {
  title: 'analyst/ConversationList',
  component: ConversationList,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-[720px] bg-[var(--color-bg-subtle)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConversationList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
