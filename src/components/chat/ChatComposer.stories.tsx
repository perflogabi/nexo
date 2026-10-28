import type { Meta, StoryObj } from '@storybook/react';
import { ChatComposer } from '@/components/chat/ChatComposer';

const meta = {
  title: 'chat/ChatComposer',
  component: ChatComposer,
  parameters: { layout: 'padded' },
  args: {
    messageCount: 16,
    messageLimit: 30,
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
