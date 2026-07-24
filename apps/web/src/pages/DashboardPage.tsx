import { Building2, Coins, Globe2, TrendingUp, Users } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, PageHeader } from '@/components/states';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatUsd, formatUsdCompact } from '@/lib/format';
import { useDashboardSummary } from '@/lib/queries';
import type { DashboardSummary } from '@/lib/types';

export function DashboardPage() {
  const query = useDashboardSummary();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the org pays people, at a glance."
      />

      {query.isError && (
        <ErrorState message="Couldn’t load the dashboard." onRetry={() => query.refetch()} />
      )}
      {query.isLoading && <StatGridSkeleton />}
      {query.data && <Dashboard summary={query.data} />}
    </>
  );
}

function Dashboard({ summary }: { summary: DashboardSummary }) {
  const usd = (minor: number | null) => (minor === null ? '—' : formatUsd(minor));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Coins}
          label="Total annual payroll"
          value={formatUsdCompact(summary.totalPayrollUsdMinor)}
          hint={formatUsd(summary.totalPayrollUsdMinor)}
        />
        <Stat icon={Users} label="Headcount" value={summary.headcount.toLocaleString()} />
        <Stat icon={TrendingUp} label="Median salary" value={usd(summary.medianUsdMinor)} />
        <Stat icon={Coins} label="Average salary" value={usd(summary.meanUsdMinor)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <HighlightCard
          icon={Building2}
          label="Most expensive team"
          primary={summary.mostExpensiveDepartment?.department ?? '—'}
          secondary={
            summary.mostExpensiveDepartment
              ? `${formatUsdCompact(summary.mostExpensiveDepartment.totalUsdMinor)} in annual pay`
              : 'No data yet'
          }
          to="/insights"
        />
        <HighlightCard
          icon={TrendingUp}
          label={`Salary changes (last ${summary.recentWindowDays} days)`}
          primary={summary.recentChangeCount.toLocaleString()}
          secondary="Raises and adjustments recorded"
          to="/employees"
        />
        <HighlightCard
          icon={Globe2}
          label="Countries"
          primary={summary.countryCount.toLocaleString()}
          secondary="Currencies normalized to USD"
          to="/insights"
        />
      </div>

      {summary.asOf && (
        <p className="text-xs text-muted-foreground">
          Figures normalized to {summary.normalizedTo} at exchange rates as of{' '}
          {formatDate(summary.asOf)}.
        </p>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight" title={hint}>
            {value}
          </p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  primary,
  secondary,
  to,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  primary: ReactNode;
  secondary: string;
  to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="space-y-1 pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" /> {label}
          </div>
          <p className="text-xl font-semibold">{primary}</p>
          <p className="text-sm text-muted-foreground">{secondary}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
