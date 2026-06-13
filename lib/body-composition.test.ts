import { describe, expect, it } from 'vitest';
import {
  computeBmi,
  estimateBodyFatFromWeightAndProfile,
  estimateLeanBodyMassKg,
} from '@/lib/body-composition';

describe('body-composition', () => {
  it('computes BMI', () => {
    expect(computeBmi(80, 1.8)).toBeCloseTo(24.69, 2);
    expect(computeBmi(0, 1.8)).toBeNull();
  });

  it('estimates body fat from profile', () => {
    const estimate = estimateBodyFatFromWeightAndProfile(80, {
      heightCm: 180,
      age: 30,
      sex: 'male',
    });
    expect(estimate).not.toBeNull();
    expect(estimate).toBeGreaterThan(5);
    expect(estimate).toBeLessThan(50);
  });

  it('returns null when profile is incomplete', () => {
    expect(estimateBodyFatFromWeightAndProfile(80, { heightCm: 180 })).toBeNull();
  });

  it('estimates lean body mass', () => {
    expect(estimateLeanBodyMassKg(80, 20)).toBeCloseTo(64, 1);
    expect(estimateLeanBodyMassKg(80, 120)).toBeNull();
  });
});
