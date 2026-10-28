import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeShell } from '@/components/chrome/EmployeeShell';
import { EmployeeProfilePanel } from '@/components/profile/EmployeeProfilePanel';
import { Typography } from '@/components/ui/Typography';

const meta = {
  title: 'profile/EmployeeProfilePanel',
  component: EmployeeProfilePanel,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EmployeeProfilePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const demo = {
  name: 'Ana Souza',
  email: 'ana.souza@nexo.com.br',
  passwordChangedDaysAgo: 42,
};

export const Default: Story = {
  args: { profile: demo },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-[var(--color-bg)]">
        <Story />
      </div>
    ),
  ],
};

/** Página completa com sidebar — Meu perfil ativo. */
export const ComShell: Story = {
  args: { profile: demo },
  render: (args) => (
    <EmployeeShell user={{ name: demo.name, email: demo.email }}>
      <header className="flex h-11 shrink-0 items-center border-b border-[var(--color-border)] px-6">
        <Typography font="schibsted" size={12.5} className="text-[var(--color-text-muted)]">
          Service desk de TI
          <span className="mx-2 text-[var(--color-text)]" aria-hidden>
            ›
          </span>
          <span className="font-medium text-[var(--color-text)]">Meu perfil</span>
        </Typography>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmployeeProfilePanel {...args} />
      </div>
    </EmployeeShell>
  ),
};
