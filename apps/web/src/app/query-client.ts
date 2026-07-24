import { QueryClient } from '@tanstack/react-query';

// Salary data changes rarely and only from this one user, so we can cache
// generously and avoid noisy refetches. Retry is modest — a failing call is
// usually a real problem worth surfacing quickly, not a blip to hammer.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
