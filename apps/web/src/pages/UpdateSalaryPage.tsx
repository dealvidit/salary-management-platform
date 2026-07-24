import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ErrorState, PageHeader } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { formatMoney, majorToMinor, minorToMajor } from '@/lib/format';
import { useEmployee, useUpdateSalary } from '@/lib/queries';
import type { EmployeeDetail } from '@/lib/types';

const REASONS = [
  'Annual review',
  'Promotion',
  'Market adjustment',
  'Retention adjustment',
  'Correction',
];

const schema = z.object({
  amount: z
    .number({ invalid_type_error: 'Enter an amount' })
    .positive('Amount must be greater than zero'),
  effectiveOn: z.string().min(1, 'Choose an effective date'),
  reason: z.string().min(1, 'Choose a reason'),
});

type FormValues = z.infer<typeof schema>;

export function UpdateSalaryPage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const query = useEmployee(employeeId);

  return (
    <>
      <Link
        to={`/employees/${employeeId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to employee
      </Link>

      {query.isLoading && <Skeleton className="h-80 max-w-xl" />}
      {query.isError && (
        <ErrorState message="Couldn’t load this employee." onRetry={() => query.refetch()} />
      )}
      {query.data && <UpdateSalaryForm employee={query.data} />}
    </>
  );
}

export function UpdateSalaryForm({ employee }: { employee: EmployeeDetail }) {
  const navigate = useNavigate();
  const mutation = useUpdateSalary(employee.id);
  const today = new Date().toISOString().slice(0, 10);
  const currentEffective = employee.currentSalary.effectiveOn.slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: minorToMajor(employee.currentSalary.amountMinor, employee.currency),
      effectiveOn: today,
      reason: REASONS[0],
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(
      {
        amountMinor: majorToMinor(values.amount, employee.currency),
        effectiveOn: new Date(values.effectiveOn).toISOString(),
        reason: values.reason,
      },
      { onSuccess: () => navigate(`/employees/${employee.id}`) },
    );
  }

  return (
    <>
      <PageHeader
        title="Update salary"
        description={`${employee.firstName} ${employee.lastName} · currently ${formatMoney(
          employee.currentSalary.amountMinor,
          employee.currency,
        )}`}
      />

      <Card className="max-w-xl">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Field
              label={`New salary (${employee.currency})`}
              htmlFor="amount"
              error={errors.amount?.message}
            >
              <Input
                id="amount"
                type="number"
                step="any"
                inputMode="decimal"
                aria-invalid={!!errors.amount}
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>

            <Field label="Effective date" htmlFor="effectiveOn" error={errors.effectiveOn?.message}>
              <Input
                id="effectiveOn"
                type="date"
                min={currentEffective}
                max={today}
                aria-invalid={!!errors.effectiveOn}
                {...register('effectiveOn')}
              />
              <p className="text-xs text-muted-foreground">
                On or after {currentEffective}, and not in the future.
              </p>
            </Field>

            <Field label="Reason" htmlFor="reason" error={errors.reason?.message}>
              <Select id="reason" aria-invalid={!!errors.reason} {...register('reason')}>
                {REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </Select>
            </Field>

            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Something went wrong. Please try again.'}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save change'}
              </Button>
              <Button asChild variant="ghost" type="button">
                <Link to={`/employees/${employee.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
