import { ArrowLeft, Pencil, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, PageHeader } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatMoney, formatUsd } from '@/lib/format';
import { useEmployee } from '@/lib/queries';
import type { EmployeeDetail, SalaryHistoryEntry } from '@/lib/types';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const query = useEmployee(employeeId);

  return (
    <>
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      {query.isLoading && <DetailSkeleton />}

      {query.isError &&
        (query.error instanceof ApiError && query.error.status === 404 ? (
          <ErrorState message="That employee doesn’t exist." />
        ) : (
          <ErrorState message="Couldn’t load this employee." onRetry={() => query.refetch()} />
        ))}

      {query.data && <EmployeeDetailView employee={query.data} />}
    </>
  );
}

function EmployeeDetailView({ employee }: { employee: EmployeeDetail }) {
  return (
    <>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeNumber} · ${employee.jobTitle}`}
        actions={
          <Button asChild>
            <Link to={`/employees/${employee.id}/salary`}>
              <Pencil className="h-4 w-4" /> Update salary
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Current salary">
              <span className="font-medium">
                {formatMoney(employee.currentSalary.amountMinor, employee.currency)}
              </span>
              {employee.currency !== 'USD' && (
                <span className="text-muted-foreground">
                  {' '}
                  ({formatUsd(employee.currentSalary.usdMinor)})
                </span>
              )}
            </Field>
            <Field label="Department">{employee.department}</Field>
            <Field label="Level">
              <Badge>{employee.level}</Badge>
            </Field>
            <Field label="Location">
              {employee.country} · paid in {employee.currency}
            </Field>
            <Field label="Email">{employee.email}</Field>
            <Field label="Hired">{formatDate(employee.hireDate)}</Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SalaryHistory history={employee.salaryHistory} currency={employee.currency} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  );
}

function SalaryHistory({ history, currency }: { history: SalaryHistoryEntry[]; currency: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Effective</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((entry, index) => {
          // History is newest-first; the previous (older) revision is next in the list.
          const older = history[index + 1];
          const delta = older ? entry.amountMinor - older.amountMinor : null;
          return (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.effectiveOn)}</TableCell>
              <TableCell className="text-muted-foreground">{entry.reason}</TableCell>
              <TableCell className="text-right font-medium">
                {formatMoney(entry.amountMinor, currency)}
              </TableCell>
              <TableCell className="text-right">
                <ChangeIndicator delta={delta} currency={currency} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ChangeIndicator({ delta, currency }: { delta: number | null; currency: string }) {
  if (delta === null || delta === 0) return <span className="text-muted-foreground">—</span>;
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 ${up ? 'text-green-600' : 'text-destructive'}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : '−'}
      {formatMoney(Math.abs(delta), currency)}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
