import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmployeeDetail } from '@/lib/types';
import { UpdateSalaryForm } from './UpdateSalaryPage';

const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@/lib/queries', () => ({
  useUpdateSalary: () => ({ mutate, isPending: false, isError: false, error: null }),
}));

const employee: EmployeeDetail = {
  id: 1,
  employeeNumber: 'EMP00001',
  firstName: 'Ada',
  lastName: 'Lovelace',
  department: 'Engineering',
  level: 'L4',
  jobTitle: 'Staff Software Engineer',
  country: 'US',
  currency: 'USD',
  email: 'ada@acme.example',
  hireDate: '2020-01-01T00:00:00.000Z',
  currentSalary: {
    amountMinor: 12_000_000,
    usdMinor: 12_000_000,
    effectiveOn: '2024-01-01T00:00:00.000Z',
  },
  salaryHistory: [],
};

function renderForm() {
  return render(
    <MemoryRouter>
      <UpdateSalaryForm employee={employee} />
    </MemoryRouter>,
  );
}

describe('UpdateSalaryForm', () => {
  beforeEach(() => mutate.mockClear());

  it('submits the amount converted to minor units', async () => {
    const user = userEvent.setup();
    renderForm();

    const amount = screen.getByLabelText(/new salary/i);
    await user.clear(amount);
    await user.type(amount, '150000');
    await user.click(screen.getByRole('button', { name: /save change/i }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toMatchObject({
      amountMinor: 15_000_000, // $150,000.00
      reason: 'Annual review',
    });
  });

  it('blocks submission and shows an error for a non-positive amount', async () => {
    const user = userEvent.setup();
    renderForm();

    const amount = screen.getByLabelText(/new salary/i);
    await user.clear(amount);
    await user.type(amount, '0');
    await user.click(screen.getByRole('button', { name: /save change/i }));

    expect(await screen.findByText(/greater than zero/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
