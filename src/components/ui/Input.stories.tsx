import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { IconEye, IconLock, IconMail } from './icons';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Email: Story = {
  args: {
    label: 'E-mail corporativo',
    placeholder: 'ana.souza@nexo.com.br',
    leadingIcon: <IconMail />,
  },
};

export const Password: Story = {
  args: {
    label: 'Senha',
    type: 'password',
    defaultValue: '••••••••',
    leadingIcon: <IconLock />,
    labelAction: (
      <button type="button" className="text-[13px] font-medium text-[var(--color-primary)]">
        Esqueci minha senha
      </button>
    ),
    trailing: (
      <button type="button" aria-label="Mostrar senha">
        <IconEye />
      </button>
    ),
  },
};
