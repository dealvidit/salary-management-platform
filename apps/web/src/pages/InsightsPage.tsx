import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState, PageHeader } from '@/components/states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatUsd, formatUsdCompact } from '@/lib/format';
import { usePayBreakdown } from '@/lib/queries';
import type { Distribution, GroupStat, PayBreakdown } from '@/lib/types';

const PRIMARY = 'var(--primary)';

export function InsightsPage() {
  const query = usePayBreakdown();

  return (
    <>
      <PageHeader title="Insights" description="Where the money goes, and how evenly." />
      {query.isError && (
        <ErrorState message="Couldn’t load insights." onRetry={() => query.refetch()} />
      )}
      {query.isLoading && <Skeleton className="h-96" />}
      {query.data && <Insights breakdown={query.data} />}
    </>
  );
}

function Insights({ breakdown }: { breakdown: PayBreakdown }) {
  return (
    <div className="space-y-6">
      <DistributionStats distribution={breakdown.distribution} />

      <ChartCard
        title="Pay distribution"
        description="How many people fall in each salary band (USD)."
      >
        <DistributionChart distribution={breakdown.distribution} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Median pay by department" description="Ranked by cost to the org.">
          <GroupBarChart groups={breakdown.byDepartment} />
        </ChartCard>
        <ChartCard title="Median pay by country" description="Normalized to USD.">
          <GroupBarChart groups={breakdown.byCountry} />
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay bands by level</CardTitle>
          <CardDescription>
            A wide gap between the lowest and highest in a band can flag inconsistent pay.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <LevelBands levels={breakdown.byLevel} />
        </CardContent>
      </Card>

      {breakdown.asOf && (
        <p className="text-xs text-muted-foreground">
          Normalized to {breakdown.normalizedTo} at rates as of {formatDate(breakdown.asOf)}.
        </p>
      )}
    </div>
  );
}

function DistributionStats({ distribution }: { distribution: Distribution }) {
  const items = [
    { label: 'People', value: distribution.count.toLocaleString() },
    { label: 'Median', value: money(distribution.median) },
    { label: 'Middle 50%', value: `${money(distribution.p25)} – ${money(distribution.p75)}` },
    { label: '90th percentile', value: money(distribution.p90) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DistributionChart({ distribution }: { distribution: Distribution }) {
  const data = distribution.histogram.map((bucket) => ({
    label: formatUsdCompact(bucket.fromUsdMinor),
    count: bucket.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} stroke="var(--muted-foreground)" />
        <YAxis fontSize={12} tickLine={false} stroke="var(--muted-foreground)" allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          formatter={(value: number) => [value.toLocaleString(), 'People']}
        />
        <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function GroupBarChart({ groups }: { groups: GroupStat[] }) {
  const data = groups.map((group) => ({ key: group.key, median: group.medianUsdMinor }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          fontSize={12}
          tickLine={false}
          stroke="var(--muted-foreground)"
          tickFormatter={(value: number) => formatUsdCompact(value)}
        />
        <YAxis type="category" dataKey="key" width={90} fontSize={12} tickLine={false} stroke="var(--muted-foreground)" />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          formatter={(value: number) => [formatUsd(value), 'Median']}
        />
        <Bar dataKey="median" fill={PRIMARY} radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.key} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LevelBands({ levels }: { levels: GroupStat[] }) {
  // Show in band order (junior -> senior) by median, so the ladder reads top-down.
  const ordered = [...levels].sort((a, b) => a.medianUsdMinor - b.medianUsdMinor);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Level</TableHead>
          <TableHead className="text-right">People</TableHead>
          <TableHead className="text-right">Lowest</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="text-right">Highest</TableHead>
          <TableHead className="text-right">Spread</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((level) => {
          const spread = level.medianUsdMinor > 0 ? level.maxUsdMinor / level.minUsdMinor : 0;
          return (
            <TableRow key={level.key}>
              <TableCell className="font-medium">{level.key}</TableCell>
              <TableCell className="text-right">{level.headcount.toLocaleString()}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatUsd(level.minUsdMinor)}
              </TableCell>
              <TableCell className="text-right font-medium">{formatUsd(level.medianUsdMinor)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatUsd(level.maxUsdMinor)}
              </TableCell>
              <TableCell className="text-right">{spread ? `${spread.toFixed(1)}×` : '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function money(minor: number | null): string {
  return minor === null ? '—' : formatUsd(minor);
}
