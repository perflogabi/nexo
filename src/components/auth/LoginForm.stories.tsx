import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[380px] bg-white p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 400));
    },
  },
};
