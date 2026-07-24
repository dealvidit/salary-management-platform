import 'dotenv/config'; // load apps/api/.env before we read configuration
import { loadConfig } from './config.js';
import { createPrismaClient } from './prisma.js';
import { buildServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const prisma = createPrismaClient();
  const app = buildServer({ config, prisma });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`${signal} received, shutting down`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ host: config.HOST, port: config.PORT });
}

main().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
