import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('applies defaults around a valid DATABASE_URL', () => {
    const config = loadConfig({ DATABASE_URL: 'file:./x.db' });
    expect(config).toMatchObject({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000,
      CORS_ORIGIN: 'http://localhost:5173',
    });
  });

  it('coerces PORT and reads overrides', () => {
    const config = loadConfig({
      DATABASE_URL: 'file:./x.db',
      PORT: '8080',
      NODE_ENV: 'production',
    });
    expect(config.PORT).toBe(8080);
    expect(config.NODE_ENV).toBe('production');
  });

  it('throws a helpful error when DATABASE_URL is missing', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it('throws when a value is the wrong type', () => {
    expect(() => loadConfig({ DATABASE_URL: 'file:./x.db', PORT: 'not-a-number' })).toThrow(
      /Invalid environment/,
    );
  });
});
