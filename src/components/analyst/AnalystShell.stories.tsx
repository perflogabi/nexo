import type { Meta, StoryObj } from '@storybook/react';
import { AnalystConsole } from '@/components/analyst/AnalystConsole';
import { AnalystChatPane } from '@/components/analyst/AnalystChatPane';
import { AnalystShell } from '@/components/analyst/AnalystShell';
import { AnalystTicketsPanel } from '@/components/analyst/AnalystTicketsPanel';

const meta = {
  title: 'analyst/AnalystShell',
  component: AnalystShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AnalystShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Desktop — 4 faixas (aguardando atendente). */
export const QuatroFaixas: Story = {
  render: () => (
    <AnalystShell>
      <AnalystChatPane />
      <AnalystTicketsPanel />
    </AnalystShell>
  ),
};

/** Desktop — atendimento assumido (tela 5). */
export const AtendimentoAssumido: Story = {
  render: () => (
    <AnalystShell>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <AnalystChatPane claimed />
        <AnalystTicketsPanel claimed />
      </div>
    </AnalystShell>
  ),
};

/** Console com navegação responsiva (lista ↔ chat, sheet de chamados). */
export const ConsoleResponsivo: Story = {
  render: () => <AnalystConsole />,
  parameters: {
    viewport: { defaultViewport: 'responsive' },
  },
};

export const MobileLista: Story = {
  render: () => <AnalystConsole />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  render: () => <AnalystConsole />,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
