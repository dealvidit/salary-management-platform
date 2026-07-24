import type { Employee, SalaryRevision } from '@prisma/client';

// Shape the API returns. We keep money as explicit minor-unit fields plus the
// currency, so the client formats it and never has to guess the scale.
export function toEmployeeSummary(employee: Employee) {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    level: employee.level,
    jobTitle: employee.jobTitle,
    country: employee.country,
    currency: employee.currency,
    currentSalary: {
      amountMinor: employee.currentSalaryMinor,
      usdMinor: employee.currentSalaryUsdMinor,
      effectiveOn: employee.currentSalaryEffectiveOn,
    },
  };
}

export function toEmployeeDetail(employee: Employee & { revisions: SalaryRevision[] }) {
  return {
    ...toEmployeeSummary(employee),
    email: employee.email,
    hireDate: employee.hireDate,
    salaryHistory: employee.revisions.map((revision) => ({
      id: revision.id,
      amountMinor: revision.amountMinor,
      currency: employee.currency,
      effectiveOn: revision.effectiveOn,
      reason: revision.reason,
      recordedAt: revision.createdAt,
    })),
  };
}
