import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  args: {
    label: 'Manter conectado neste computador',
    defaultChecked: true,
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
