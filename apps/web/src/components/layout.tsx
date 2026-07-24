import { BarChart3, LayoutDashboard, Users } from 'lucide-react';
import { Suspense, type ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar on desktop, top bar on mobile. */}
      <aside className="border-b border-border bg-card md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ACME</p>
            <p className="text-xs text-muted-foreground">Salary Management</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-1 md:px-3">
          <NavItems />
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-6xl space-y-6 p-5 md:p-8">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
