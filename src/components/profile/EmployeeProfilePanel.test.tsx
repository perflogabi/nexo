import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmployeeProfilePanel } from '@/components/profile/EmployeeProfilePanel';

describe('EmployeeProfilePanel', () => {
  const profile = {
    name: 'Ana Souza',
    email: 'ana.souza@nexo.com.br',
    passwordChangedDaysAgo: 42,
  };

  it('mostra dados pessoais e card de senha do protótipo', () => {
    render(<EmployeeProfilePanel profile={profile} />);

    expect(screen.getByRole('heading', { name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByText('Seus dados de acesso ao service desk de TI.')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getAllByText('ana.souza@nexo.com.br').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gerenciado pela TI')).toBeInTheDocument();
    expect(screen.getByText('Senha')).toBeInTheDocument();
    expect(screen.getByText('Alterada há 42 dias')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redefinir senha' })).toBeInTheDocument();
    expect(
      screen.getByText(/Enviaremos um link de redefinição para ana\.souza@nexo\.com\.br/),
    ).toBeInTheDocument();
  });
});
