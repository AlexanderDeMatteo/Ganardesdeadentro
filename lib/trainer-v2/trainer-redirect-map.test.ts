import { describe, expect, it } from 'vitest';
import {
  resolveTrainerNutritionRedirect,
  resolveTrainerV2Redirect,
  TRAINER_LEGACY_TO_V2_REDIRECTS,
} from '@/lib/trainer-v2/trainer-redirect-map';

describe('trainer-redirect-map', () => {
  it('maps legacy trainer routes to trainer-v2', () => {
    expect(TRAINER_LEGACY_TO_V2_REDIRECTS['/trainer']).toBe('/trainer-v2');
    expect(TRAINER_LEGACY_TO_V2_REDIRECTS['/trainer/athletes']).toBe('/trainer-v2/athletes');
    expect(TRAINER_LEGACY_TO_V2_REDIRECTS['/trainer/exercises']).toBe('/trainer-v2/exercises');
  });

  it('resolves nutrition sub-routes', () => {
    expect(resolveTrainerNutritionRedirect('abc-123')).toBe(
      '/trainer-v2/athletes/abc-123/nutrition',
    );
    expect(resolveTrainerV2Redirect('/trainer/athletes/abc-123/nutrition')).toBe(
      '/trainer-v2/athletes/abc-123/nutrition',
    );
  });

  it('returns null for unknown paths', () => {
    expect(resolveTrainerV2Redirect('/dashboard')).toBeNull();
  });
});
