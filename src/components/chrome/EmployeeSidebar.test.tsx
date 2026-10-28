import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EmployeeSidebar } from './EmployeeSidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} />;
  },
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

describe('EmployeeSidebar', () => {
  const user = { name: 'Ana Souza', email: 'ana.souza@nexo.com.br' };

  it('mostra nav e usuário no modo expandido', () => {
    render(<EmployeeSidebar user={user} collapsed={false} />);
    expect(screen.getByRole('link', { name: 'Atendimento' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('ana.souza@nexo.com.br')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('esconde labels no modo encolhido', () => {
    render(<EmployeeSidebar user={user} collapsed={true} />);
    expect(screen.queryByText('Atendimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Meu perfil')).not.toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
