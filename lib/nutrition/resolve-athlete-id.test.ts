import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findAthleteById, resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';

const ENV_KEYS = [
  'NEXT_PUBLIC_AUTH_SOURCE',
  'NEXT_PUBLIC_DATA_SOURCE_USERS',
  'NEXT_PUBLIC_DATA_SOURCE_METRICS',
  'NEXT_PUBLIC_DATA_SOURCE_NUTRITION',
  'NEXT_PUBLIC_DATA_SOURCE_ROUTINES',
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

describe('resolveAthleteId', () => {
  it('returns null for non-athlete roles', () => {
    expect(resolveAthleteId({ id: '1', email: 't@x.com', role: 'trainer' })).toBeNull();
  });

  it('uses user.id when auth is api', () => {
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    expect(
      resolveAthleteId({ id: '42', email: 'athlete@example.com', role: 'user' }),
    ).toBe('42');
  });

  it('uses user.id when only routines is api', () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE_ROUTINES = 'api';
    expect(
      resolveAthleteId({ id: '42', email: 'pro@example.com', role: 'user' }),
    ).toBe('42');
  });

  it('maps demo email in local mode', () => {
    expect(
      resolveAthleteId({ id: '99', email: 'pro@example.com', role: 'user' }),
    ).toBe('1');
  });
});

describe('findAthleteById', () => {
  it('returns null in API lookup mode', () => {
    process.env.NEXT_PUBLIC_AUTH_SOURCE = 'api';
    expect(findAthleteById('1')).toBeNull();
  });
});
