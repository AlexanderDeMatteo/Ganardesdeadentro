import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getApiBaseUrl,
  getAuthSource,
  getDataSource,
  getMetricsDataSource,
  getServerApiBaseUrl,
  isFullApiMode,
} from '@/lib/api/config';

const ENV_KEYS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'API_INTERNAL_URL',
  'NEXT_PUBLIC_AUTH_SOURCE',
  'NEXT_PUBLIC_DATA_SOURCE',
  'NEXT_PUBLIC_DATA_SOURCE_METRICS',
  'NEXT_PUBLIC_DATA_SOURCE_ROUTINES',
  'NEXT_PUBLIC_DATA_SOURCE_USERS',
  'NEXT_PUBLIC_DATA_SOURCE_NUTRITION',
  'NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS',
] as const;

const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

describe('api config', () => {
  it('defaults to local auth and data sources', () => {
    expect(getAuthSource()).toBe('local');
    expect(getDataSource()).toBe('local');
    expect(getMetricsDataSource()).toBe('local');
    expect(isFullApiMode()).toBe(false);
  });

  it('honours per-domain overrides', () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE = 'local';
    process.env.NEXT_PUBLIC_DATA_SOURCE_METRICS = 'api';
    expect(getMetricsDataSource()).toBe('api');
    expect(getDataSource()).toBe('local');
  });

  it('detects full API mode when all flags are api', () => {
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_METRICS = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_ROUTINES = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_USERS = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_NUTRITION = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS = 'api';
    expect(isFullApiMode()).toBe(true);
  });

  it('uses API_INTERNAL_URL for server-side requests when set', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5000';
    process.env.API_INTERNAL_URL = 'http://fittrack-backend:5000';
    expect(getApiBaseUrl()).toBe('http://localhost:5000');
    expect(getServerApiBaseUrl()).toBe('http://fittrack-backend:5000');
  });

  it('falls back to public API URL when API_INTERNAL_URL is unset', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:5000';
    expect(getServerApiBaseUrl()).toBe('http://localhost:5000');
  });

  it('is not full API mode if any domain stays local', () => {
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_METRICS = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_ROUTINES = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_USERS = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_NUTRITION = 'api';
    process.env.NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS = 'local';
    expect(isFullApiMode()).toBe(false);
  });
});
