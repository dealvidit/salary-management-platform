import { normalizeToUsdMinor } from '../../domain/money.js';
import { NotFoundError } from '../../lib/errors.js';
import type { PrismaClient } from '../../prisma.js';
import { getEmployeeById } from '../employees/employees.service.js';
import type { CreateRevisionInput } from './salary.schema.js';
import { assertValidEffectiveDate } from './salary.rules.js';

async function latestUsdRate(prisma: PrismaClient, currency: string): Promise<number> {
  const rate = await prisma.fxRate.findFirst({
    where: { currency },
    orderBy: { effectiveOn: 'desc' },
  });
  if (!rate) throw new Error(`No FX rate configured for ${currency}`);
  return rate.usdPerUnit;
}

/**
 * Record a salary change. Appends a revision and moves the employee's current
 * salary projection to match — both in one transaction, so the projection can
 * never drift from the history it's derived from.
 */
export async function updateSalary(
  prisma: PrismaClient,
  employeeId: number,
  input: CreateRevisionInput,
  now: Date = new Date(),
) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

  assertValidEffectiveDate(input.effectiveOn, employee.currentSalaryEffectiveOn, now);

  const usdPerUnit = await latestUsdRate(prisma, employee.currency);
  const currentSalaryUsdMinor = normalizeToUsdMinor(
    input.amountMinor,
    employee.currency,
    usdPerUnit,
  );

  await prisma.$transaction([
    prisma.salaryRevision.create({
      data: {
        employeeId,
        amountMinor: input.amountMinor,
        effectiveOn: input.effectiveOn,
        reason: input.reason,
      },
    }),
    prisma.employee.update({
      where: { id: employeeId },
      data: {
        currentSalaryMinor: input.amountMinor,
        currentSalaryUsdMinor,
        currentSalaryEffectiveOn: input.effectiveOn,
      },
    }),
  ]);

  return getEmployeeById(prisma, employeeId);
}
