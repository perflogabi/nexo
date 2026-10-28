import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from './Typography';

const meta: Meta<typeof Typography> = {
  title: 'UI/Typography',
  component: Typography,
  args: {
    children: 'Nexo Assist',
  },
};
export default meta;

type Story = StoryObj<typeof Typography>;

export const Newsreader54: Story = {
  args: {
    font: 'newsreader',
    size: 54,
    weight: 'medium',
    children: 'Seu problema de TI, resolvido em uma conversa.',
  },
};

export const Newsreader40: Story = {
  args: { font: 'newsreader', size: 40, weight: 'medium', children: 'Entrar' },
};

export const Newsreader22: Story = {
  args: { font: 'newsreader', size: 22, weight: 'medium', children: '8 s' },
};

export const Schibsted16: Story = {
  args: { font: 'schibsted', size: 16, children: 'Service desk de TI da Nexo' },
};

export const Schibsted155: Story = {
  args: {
    font: 'schibsted',
    size: 15.5,
    children: 'Use seu e-mail corporativo e a senha da rede Nexo.',
  },
};
