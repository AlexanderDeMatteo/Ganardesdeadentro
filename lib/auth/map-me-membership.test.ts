import { describe, expect, it } from 'vitest';
import { mapMeMembership } from '@/lib/auth/map-me-membership';

describe('mapMeMembership', () => {
  it('maps custom plan names when membership is active', () => {
    const result = mapMeMembership({
      planId: '5',
      name: 'Premium Pay',
      functionalTier: 'premium',
      daysRemaining: 29,
      features: ['Rutinas'],
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      price: 5,
      durationDays: 30,
    });

    expect(result).toEqual({
      id: '5',
      name: 'Premium Pay',
      displayName: 'Premium',
      functionalTier: 'premium',
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      daysRemaining: 29,
      price: 5,
      features: ['Rutinas'],
      durationDays: 30,
    });
  });

  it('infers tier from plan name when functionalTier is missing', () => {
    const result = mapMeMembership({
      planId: '3',
      name: 'Pro Elite',
      daysRemaining: 10,
    });

    expect(result?.functionalTier).toBe('pro');
    expect(result?.displayName).toBe('Pro');
  });

  it('returns undefined when daysRemaining is zero', () => {
    const result = mapMeMembership({
      planId: '1',
      name: 'Básica',
      functionalTier: 'basic',
      daysRemaining: 0,
    });

    expect(result).toBeUndefined();
  });
});
