/**
 * Auth demo: e-mail seed válido + qualquer senha (E/T). Sem passwordHash.
 * Role sempre lido do Employee no servidor — nunca confiar no client.
 */

import { AuthError } from '@/domain/errors';
import type { Role } from '@/domain/types';
import { signSession, type SessionPayload } from '@/lib/session';

export type AuthEmployee = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
};

export type EmployeeDirectory = {
  findByEmail(email: string): Promise<AuthEmployee | null>;
  findById(id: string): Promise<AuthEmployee | null>;
};

export type AuthService = {
  login(input: {
    email: string;
    password: string;
    secret: string;
    nowSec?: number;
  }): Promise<{ session: SessionPayload; token: string; employee: AuthEmployee }>;
  getSessionEmployee(session: SessionPayload | null): Promise<AuthEmployee | null>;
};

export function createAuthService(directory: EmployeeDirectory): AuthService {
  return {
    async login({ email, password, secret, nowSec }) {
      // Qualquer senha não vazia (demo). Vazio rejeitado só por UX básica.
      if (!password || password.length === 0) {
        throw new AuthError('INVALID_CREDENTIALS', 'Password required');
      }
      const normalized = email.trim().toLowerCase();
      const employee = await directory.findByEmail(normalized);
      if (!employee) {
        throw new AuthError('INVALID_CREDENTIALS', 'Unknown email');
      }
      // Re-fetch by id garante role atual do servidor
      const fresh = (await directory.findById(employee.id)) ?? employee;
      const session: SessionPayload = {
        employeeId: fresh.id,
        role: fresh.role,
        email: fresh.email,
        name: fresh.name,
        exp: (nowSec ?? Math.floor(Date.now() / 1000)) + 60 * 60 * 24 * 7,
      };
      const token = await signSession(session, secret, nowSec);
      return { session, token, employee: fresh };
    },

    async getSessionEmployee(session) {
      if (!session) return null;
      return directory.findById(session.employeeId);
    },
  };
}

export function createInMemoryEmployeeDirectory(employees: AuthEmployee[]): EmployeeDirectory {
  const byEmail = new Map(employees.map((e) => [e.email.toLowerCase(), e]));
  const byId = new Map(employees.map((e) => [e.id, e]));
  return {
    async findByEmail(email) {
      return byEmail.get(email.trim().toLowerCase()) ?? null;
    },
    async findById(id) {
      return byId.get(id) ?? null;
    },
  };
}
