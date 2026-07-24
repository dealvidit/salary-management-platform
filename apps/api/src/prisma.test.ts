import { describe, expect, it } from 'vitest';
import { createPrismaClient } from './prisma.js';

describe('createPrismaClient', () => {
  it('constructs with an explicit database url', async () => {
    const client = createPrismaClient('file:./unused.db');
    expect(client).toBeDefined();
    await client.$disconnect();
  });

  it('constructs with no url (falls back to the environment)', async () => {
    const client = createPrismaClient();
    expect(client).toBeDefined();
    await client.$disconnect();
  });
});
