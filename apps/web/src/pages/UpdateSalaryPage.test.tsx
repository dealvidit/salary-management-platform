import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { useEmployee, useUpdateSalary } from '@/lib/queries';
import type { EmployeeDetail } from '@/lib/types';
import { UpdateSalaryForm, UpdateSalaryPage } from './UpdateSalaryPage';

vi.mock('@/lib/queries', () => ({ useEmployee: vi.fn(), useUpdateSalary: vi.fn() }));
const mockedUseEmployee = vi.mocked(useEmployee);
const mockedUseUpdateSalary = vi.mocked(useUpdateSalary);
const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

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

function setMutation(state: Record<string, unknown>) {
  mockedUseUpdateSalary.mockReturnValue(state as unknown as ReturnType<typeof useUpdateSalary>);
}
function setEmployee(state: Record<string, unknown>) {
  mockedUseEmployee.mockReturnValue(state as unknown as ReturnType<typeof useEmployee>);
}

beforeEach(() => {
  vi.clearAllMocks();
  setMutation({ mutate, isPending: false, isError: false, error: null });
});

function renderForm() {
  return render(
    <MemoryRouter>
      <UpdateSalaryForm employee={employee} />
    </MemoryRouter>,
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees/1/salary']}>
      <Routes>
        <Route path="/employees/:id/salary" element={<UpdateSalaryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UpdateSalaryForm', () => {
  it('submits the amount converted to minor units', async () => {
    const user = userEvent.setup();
    renderForm();
    const amount = screen.getByLabelText(/new salary/i);
    await user.clear(amount);
    await user.type(amount, '150000');
    await user.click(screen.getByRole('button', { name: /save change/i }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toMatchObject({
      amountMinor: 15_000_000,
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

  it('surfaces a server error message from the mutation', () => {
    setMutation({
      mutate,
      isPending: false,
      isError: true,
      error: new ApiError(400, 'Effective date is invalid'),
    });
    renderForm();
    expect(screen.getByRole('alert')).toHaveTextContent('Effective date is invalid');
  });

  it('falls back to a generic message for a non-API error', () => {
    setMutation({ mutate, isPending: false, isError: true, error: new Error('weird') });
    renderForm();
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
  });
});

describe('UpdateSalaryPage', () => {
  it('shows a loading skeleton while the employee loads', () => {
    setEmployee({ isLoading: true, isError: false });
    renderPage();
    expect(screen.getByText(/back to employee/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save change/i })).not.toBeInTheDocument();
  });

  it('shows a retryable error', async () => {
    const refetch = vi.fn();
    setEmployee({ isError: true, isLoading: false, refetch });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the form once the employee is loaded', () => {
    setEmployee({ isLoading: false, isError: false, data: employee });
    renderPage();
    expect(screen.getByRole('heading', { name: /update salary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save change/i })).toBeInTheDocument();
  });
});
