import type { Meta, StoryObj } from '@storybook/react';
import { AnalystRail } from '@/components/analyst/AnalystRail';

const meta = {
  title: 'analyst/AnalystRail',
  component: AnalystRail,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-[640px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnalystRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
