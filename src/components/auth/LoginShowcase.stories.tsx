import type { Meta, StoryObj } from '@storybook/react';
import { LOGIN_LEFT_BLOCK } from './login-layout';
import { LoginShowcase, LoginShowcaseBottom, LoginShowcaseTop } from './LoginShowcase';

const meta: Meta = {
  title: 'Auth/LoginShowcase',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

/** Coluna esquerda: 3 slots na mesma largura centralizada. */
export const FullColumn: Story = {
  render: () => (
    <div className="flex min-h-screen w-[56%] flex-col items-center bg-[var(--color-navy)] px-10 py-7">
      <div className={LOGIN_LEFT_BLOCK}>
        <LoginShowcaseTop />
      </div>
      <div className={`flex flex-1 flex-col justify-center ${LOGIN_LEFT_BLOCK}`}>
        <LoginShowcase />
      </div>
      <div className={LOGIN_LEFT_BLOCK}>
        <LoginShowcaseBottom />
      </div>
    </div>
  ),
};

export const MiddleOnly: Story = {
  render: () => (
    <div className="flex min-h-screen w-[56%] items-center justify-center bg-[var(--color-navy)] px-10">
      <div className={LOGIN_LEFT_BLOCK}>
        <LoginShowcase />
      </div>
    </div>
  ),
};
