import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { queryClient } from './app/query-client';
import { Layout } from './components/layout';
import { NotFoundPage } from './pages/NotFoundPage';
import { Placeholder } from './pages/placeholder';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Placeholder title="Dashboard" />} />
            <Route path="employees" element={<Placeholder title="Employees" />} />
            <Route path="employees/:id" element={<Placeholder title="Employee" />} />
            <Route path="employees/:id/salary" element={<Placeholder title="Update salary" />} />
            <Route path="insights" element={<Placeholder title="Insights" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
