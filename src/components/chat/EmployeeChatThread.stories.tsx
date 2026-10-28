import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeChatThread } from '@/components/chat/EmployeeChatThread';

const meta = {
  title: 'chat/EmployeeChatThread',
  component: EmployeeChatThread,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="flex h-[900px] flex-col bg-white">
        <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-[var(--color-border)] px-6">
          <p className="font-ui text-[12.5px] text-[var(--color-text-muted)]">
            Service desk de TI
            <span className="mx-2 text-[var(--color-text)]" aria-hidden>
              ›
            </span>
            <span className="text-[var(--color-text)]">Atendimento</span>
          </p>
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-success-soft)] px-3 py-1 text-[12.5px] font-medium text-[var(--color-success)]">
            <span className="size-2 rounded-full bg-[var(--color-success)]" aria-hidden />
            Assistente online
          </span>
        </header>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmployeeChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConsultaTransferencia: Story = {};
