import type { Meta, StoryObj } from '@storybook/react';

function Placeholder({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800">{label}</p>
  );
}

const meta = {
  title: 'Bootstrap/Placeholder',
  component: Placeholder,
} satisfies Meta<typeof Placeholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Nexo Assist — Storybook bootstrap',
  },
};
