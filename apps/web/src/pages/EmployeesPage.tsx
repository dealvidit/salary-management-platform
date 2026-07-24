import { ArrowDown, ArrowUp, ChevronsUpDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatUsd } from '@/lib/format';
import { useEmployees, useMeta } from '@/lib/queries';
import {
  EMPLOYEE_PAGE_SIZE,
  useEmployeeListState,
  type SortField,
} from '@/lib/use-employee-list-state';

export function EmployeesPage() {
  const {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    page,
    setPage,
    hasFilters,
    clearAll,
    params,
  } = useEmployeeListState();

  const meta = useMeta();
  const employees = useEmployees(params);

  const total = employees.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Employees"
        description={
          employees.data ? `${total.toLocaleString()} people across the org` : 'Loading…'
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search by name or ID…"
          aria-label="Search employees"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <FilterSelect
          label="Department"
          value={filters.department}
          options={meta.data?.departments}
          onChange={(value) => setFilter('department', value)}
        />
        <FilterSelect
          label="Country"
          value={filters.country}
          options={meta.data?.countries}
          onChange={(value) => setFilter('country', value)}
        />
        <FilterSelect
          label="Level"
          value={filters.level}
          options={meta.data?.levels}
          onChange={(value) => setFilter('level', value)}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {employees.isError ? (
        <ErrorState message="Couldn’t load employees." onRetry={() => employees.refetch()} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Employee" field="name" sort={sort} onSort={toggleSort} />
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Location</TableHead>
                <SortHeader
                  label="Current salary"
                  field="salary"
                  sort={sort}
                  onSort={toggleSort}
                  align="right"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.isLoading ? (
                <LoadingRows />
              ) : total === 0 ? (
                <tr>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No matching employees"
                      description="Try clearing a filter or changing your search."
                    />
                  </TableCell>
                </tr>
              ) : (
                employees.data?.data.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link
                        to={`/employees/${employee.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {employee.firstName} {employee.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {employee.employeeNumber} · {employee.jobTitle}
                      </p>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Badge>{employee.level}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.country} · {employee.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {formatMoney(employee.currentSalary.amountMinor, employee.currency)}
                      </div>
                      {employee.currency !== 'USD' && (
                        <div className="text-xs text-muted-foreground">
                          {formatUsd(employee.currentSalary.usdMinor)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {total > EMPLOYEE_PAGE_SIZE && (
        <Pagination page={page} pageSize={EMPLOYEE_PAGE_SIZE} total={total} onChange={setPage} />
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      aria-label={`Filter by ${label.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClear={value ? () => onChange('') : undefined}
      className="w-40"
    >
      <option value="">{label}: All</option>
      {options?.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  field: SortField;
  sort: { field: SortField; order: 'asc' | 'desc' };
  onSort: (field: SortField) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.field === field;
  const Icon = !active ? ChevronsUpDown : sort.order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 font-medium hover:text-foreground ${align === 'right' ? 'ml-auto' : ''}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full max-w-[160px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from.toLocaleString()}</span>–
        <span className="font-medium text-foreground">{to.toLocaleString()}</span> of{' '}
        {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <span className="text-muted-foreground">
          Page {page} of {totalPages.toLocaleString()}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
