import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeSidebar } from './EmployeeSidebar';

const meta: Meta<typeof EmployeeSidebar> = {
  title: 'Chrome/EmployeeSidebar',
  component: EmployeeSidebar,
  parameters: { layout: 'fullscreen' },
  args: {
    user: { name: 'Ana Souza', email: 'ana.souza@nexo.com.br' },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen bg-[var(--color-bg-subtle)]">
        <Story />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-muted)]">
          Conteúdo principal
        </div>
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof EmployeeSidebar>;

export const Expanded: Story = {
  args: { collapsed: false },
};

export const Collapsed: Story = {
  args: { collapsed: true },
};
