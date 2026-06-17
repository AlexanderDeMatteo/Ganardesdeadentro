import { describe, expect, it } from 'vitest';
import {
  ADMIN_LEGACY_TO_V2_REDIRECTS,
  ADMIN_V2_ONLY_PATHS,
  resolveAdminNutritionRedirect,
  resolveAdminV2Redirect,
} from '@/lib/admin-v2/admin-redirect-map';

describe('admin-redirect-map', () => {
  it('maps all static legacy admin routes', () => {
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin']).toBe('/admin-v2');
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin/athletes']).toBe('/admin-v2/athletes');
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin/trainers']).toBe('/admin-v2/trainers');
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin/routines']).toBe('/admin-v2/routines');
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin/assignments']).toBe('/admin-v2/assignments');
    expect(ADMIN_LEGACY_TO_V2_REDIRECTS['/admin/memberships']).toBe('/admin-v2/memberships');
  });

  it('resolves nutrition subroutes with athlete id', () => {
    expect(resolveAdminNutritionRedirect('athlete-9')).toBe('/admin-v2/athletes/athlete-9/nutrition');
    expect(resolveAdminV2Redirect('/admin/athletes/athlete-9/nutrition')).toBe(
      '/admin-v2/athletes/athlete-9/nutrition',
    );
  });

  it('returns null for unknown legacy paths', () => {
    expect(resolveAdminV2Redirect('/admin/unknown')).toBeNull();
  });

  it('documents v2-only sections', () => {
    expect(ADMIN_V2_ONLY_PATHS).toContain('/admin-v2/exercises');
  });
});
