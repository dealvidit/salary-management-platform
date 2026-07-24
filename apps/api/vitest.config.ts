import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts', 'prisma/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**', 'prisma/reference.ts'],
      // Excluded: the process entrypoint (bootstraps a real server + signal
      // handlers) and the one-off seed script. Everything else is covered.
      exclude: ['src/index.ts', '**/*.test.ts'],
      reporter: ['text-summary', 'text'],
      thresholds: { statements: 95, lines: 95, functions: 90, branches: 90 },
    },
  },
});
