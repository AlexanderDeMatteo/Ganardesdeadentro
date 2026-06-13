import { describe, expect, it } from 'vitest';
import {
  isProfileCompleteForBodyFatEstimate,
  parseBodyProfileJson,
} from '@/lib/body-profile';

describe('body-profile', () => {
  it('parses valid JSON profile', () => {
    const profile = parseBodyProfileJson(
      JSON.stringify({ heightCm: 180, age: 30, sex: 'male' }),
    );
    expect(profile).toEqual({ heightCm: 180, age: 30, sex: 'male' });
  });

  it('returns empty object for invalid JSON', () => {
    expect(parseBodyProfileJson('not-json')).toEqual({});
    expect(parseBodyProfileJson(null)).toEqual({});
  });

  it('rejects incomplete profile for body fat estimate', () => {
    expect(isProfileCompleteForBodyFatEstimate({ heightCm: 180 })).toBe(false);
    expect(
      isProfileCompleteForBodyFatEstimate({ heightCm: 180, age: 30, sex: 'female' }),
    ).toBe(true);
  });

  it('rejects out-of-range height or age', () => {
    expect(
      isProfileCompleteForBodyFatEstimate({ heightCm: 30, age: 30, sex: 'male' }),
    ).toBe(false);
    expect(
      isProfileCompleteForBodyFatEstimate({ heightCm: 175, age: 10, sex: 'male' }),
    ).toBe(false);
  });
});
