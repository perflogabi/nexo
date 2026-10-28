import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Typography } from './Typography';

describe('Typography', () => {
  it('aplica Newsreader e tamanho 54', () => {
    render(
      <Typography font="newsreader" size={54} weight="medium">
        Headline
      </Typography>,
    );
    const el = screen.getByText('Headline');
    expect(el.className).toContain('font-display');
    expect(el.className).toContain('text-[54px]');
  });

  it('aplica Schibsted e tamanho 15.5', () => {
    render(
      <Typography font="schibsted" size={15.5}>
        Corpo
      </Typography>,
    );
    const el = screen.getByText('Corpo');
    expect(el.className).toContain('font-ui');
    expect(el.className).toContain('text-[15.5px]');
  });

  it('respeita o elemento semântico via as', () => {
    render(
      <Typography as="h1" font="newsreader" size={40}>
        Entrar
      </Typography>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
  });
});
