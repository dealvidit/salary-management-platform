import { defineConfig } from 'tsup';

// Bundle only our own source; dependencies (Prisma, Fastify) stay external and
// are resolved from node_modules at runtime. Keeps the build fast and avoids
// bundling Prisma's query engine.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
});
