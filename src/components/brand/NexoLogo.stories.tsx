import type { Meta, StoryObj } from '@storybook/react';
import { NexoLogo } from './NexoLogo';

const meta: Meta<typeof NexoLogo> = {
  title: 'Brand/NexoLogo',
  component: NexoLogo,
};
export default meta;
type Story = StoryObj<typeof NexoLogo>;

export const App: Story = { args: { variant: 'app', height: 20 } };

export const BrandOnNavy: Story = {
  args: { variant: 'brand', height: 28 },
  decorators: [
    (Story) => (
      <div className="bg-[var(--color-navy)] p-6">
        <Story />
      </div>
    ),
  ],
};

export const AppMarkOnly: Story = {
  args: { variant: 'app', showWordmark: false, height: 28 },
};

/** Mark do sidebar encolhido (anexo Logo). */
export const CollapsedMark: Story = {
  args: { variant: 'mark', height: 28 },
};
