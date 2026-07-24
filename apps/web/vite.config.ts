import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy API calls in dev so the browser talks to one origin. The backend
    // owns the /api prefix, so we forward the path unchanged.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**'],
      // Excluded: the entrypoint, the route table (thin lazy-import wiring), the
      // vite type shim and test setup.
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/lib/types.ts', // pure type declarations, no runtime code
        'src/vite-env.d.ts',
        'src/test/**',
        '**/*.test.{ts,tsx}',
      ],
      reporter: ['text-summary', 'text'],
      thresholds: { statements: 95, lines: 95, functions: 90, branches: 90 },
    },
  },
});
