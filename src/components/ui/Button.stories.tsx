import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Entrar',
    size: 'md',
    variant: 'primary',
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const LoginEntrar: Story = {
  args: { children: 'Entrar', iconEnd: 'arrow', size: 'md' },
};

export const WithSendIcon: Story = {
  args: { icon: 'send', children: 'Enviar' },
};

export const WithHeadphonesIcon: Story = {
  args: { icon: 'headphones', children: 'Falar com analista' },
};

export const WithArrowUpIcon: Story = {
  args: { icon: 'arrowUp', children: 'Subir na fila' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
    </div>
  ),
};
