import type { PrismaClient } from '../src/prisma.js';

let counter = 0;

interface EmployeeOverrides {
  firstName?: string;
  lastName?: string;
  department?: string;
  level?: string;
  country?: string;
  currency?: string;
  currentSalaryMinor?: number;
  currentSalaryUsdMinor?: number;
  hireDate?: Date;
}

/**
 * Insert an employee plus an initial salary revision. Fields default to sensible
 * values so a test only states what it actually cares about.
 */
export async function seedEmployee(prisma: PrismaClient, overrides: EmployeeOverrides = {}) {
  counter += 1;
  const effectiveOn = overrides.hireDate ?? new Date('2020-01-01T00:00:00.000Z');
  const currentSalaryMinor = overrides.currentSalaryMinor ?? 10_000_000;
  const currentSalaryUsdMinor = overrides.currentSalaryUsdMinor ?? currentSalaryMinor;

  return prisma.employee.create({
    data: {
      employeeNumber: `EMP${String(counter).padStart(5, '0')}`,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? `Person${counter}`,
      email: `person${counter}@acme.example`,
      country: overrides.country ?? 'US',
      currency: overrides.currency ?? 'USD',
      department: overrides.department ?? 'Engineering',
      level: overrides.level ?? 'L3',
      jobTitle: 'Senior Software Engineer',
      hireDate: overrides.hireDate ?? effectiveOn,
      currentSalaryMinor,
      currentSalaryUsdMinor,
      currentSalaryEffectiveOn: effectiveOn,
      revisions: {
        create: { amountMinor: currentSalaryMinor, effectiveOn, reason: 'Initial salary' },
      },
    },
  });
}
