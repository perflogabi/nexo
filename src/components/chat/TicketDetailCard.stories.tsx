import type { Meta, StoryObj } from '@storybook/react';
import { DEMO_TICKET_DETAIL } from '@/components/chat/chat-demo-data';
import { TicketDetailCard } from '@/components/chat/TicketDetailCard';

const meta = {
  title: 'chat/TicketDetailCard',
  component: TicketDetailCard,
  parameters: { layout: 'padded' },
  args: {
    number: DEMO_TICKET_DETAIL.number,
    status: DEMO_TICKET_DETAIL.status,
    title: DEMO_TICKET_DETAIL.title,
    description: DEMO_TICKET_DETAIL.description,
    meta: DEMO_TICKET_DETAIL.meta,
  },
} satisfies Meta<typeof TicketDetailCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
