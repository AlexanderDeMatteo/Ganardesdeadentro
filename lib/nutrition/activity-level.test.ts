import { describe, expect, it } from 'vitest';
import { normalizeActivityLevel } from './activity-level';

describe('normalizeActivityLevel', () => {
  it('maps legacy intense values to backend enums', () => {
    expect(normalizeActivityLevel('intense')).toBe('active');
    expect(normalizeActivityLevel('very_intense')).toBe('very_active');
  });

  it('keeps valid backend values', () => {
    expect(normalizeActivityLevel('moderate')).toBe('moderate');
    expect(normalizeActivityLevel('very_active')).toBe('very_active');
  });

  it('falls back for invalid values', () => {
    expect(normalizeActivityLevel('invalid')).toBe('moderate');
    expect(normalizeActivityLevel(null, 'active')).toBe('active');
  });
});
