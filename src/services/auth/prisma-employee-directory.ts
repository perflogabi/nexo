import type { PrismaClient } from '@prisma/client';
import type { AuthEmployee, EmployeeDirectory } from './auth-service';

export function createPrismaEmployeeDirectory(prisma: PrismaClient): EmployeeDirectory {
  return {
    async findByEmail(email) {
      const row = await prisma.employee.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      return row ? map(row) : null;
    },
    async findById(id) {
      const row = await prisma.employee.findUnique({ where: { id } });
      return row ? map(row) : null;
    },
  };
}

function map(row: {
  id: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'ANALYST';
  department: string | null;
}): AuthEmployee {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department,
  };
}
