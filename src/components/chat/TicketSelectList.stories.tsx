import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DEMO_TICKETS } from '@/components/chat/chat-demo-data';
import { TicketSelectList } from '@/components/chat/TicketSelectList';

function Interactive() {
  const [value, setValue] = useState(DEMO_TICKETS[0].id);
  return <TicketSelectList items={DEMO_TICKETS} value={value} onChange={setValue} />;
}

const meta = {
  title: 'chat/TicketSelectList',
  component: TicketSelectList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TicketSelectList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: DEMO_TICKETS,
    value: DEMO_TICKETS[0].id,
    onChange: () => undefined,
  },
  render: () => <Interactive />,
};
