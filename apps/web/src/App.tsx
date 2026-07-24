import { QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { queryClient } from './app/query-client';
import { Layout } from './components/layout';
import { NotFoundPage } from './pages/NotFoundPage';

// Route-level code splitting keeps the initial bundle small — the chart-heavy
// Insights page in particular loads its dependencies only when visited.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const EmployeesPage = lazy(() =>
  import('./pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeDetailPage = lazy(() =>
  import('./pages/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })),
);
const UpdateSalaryPage = lazy(() =>
  import('./pages/UpdateSalaryPage').then((m) => ({ default: m.UpdateSalaryPage })),
);
const InsightsPage = lazy(() =>
  import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })),
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/:id" element={<EmployeeDetailPage />} />
            <Route path="employees/:id/salary" element={<UpdateSalaryPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
