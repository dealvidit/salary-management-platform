import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { queryClient } from './app/query-client';
import { Layout } from './components/layout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Placeholder } from './pages/placeholder';
import { UpdateSalaryPage } from './pages/UpdateSalaryPage';

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
            <Route path="insights" element={<Placeholder title="Insights" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
