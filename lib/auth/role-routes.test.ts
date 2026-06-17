import { describe, expect, it } from 'vitest';
import {
  canRoleAccessPath,
  getHomeRouteForRole,
  getNavItemsForRole,
} from '@/lib/auth/role-routes';

describe('role-routes admin cutover', () => {
  it('sends admin home to admin-v2', () => {
    expect(getHomeRouteForRole('admin')).toBe('/admin-v2');
  });

  it('exposes admin-v2 navigation items for admin role', () => {
    const items = getNavItemsForRole('admin');
    expect(items[0]?.href).toBe('/admin-v2');
    expect(items.some((item) => item.href === '/admin-v2/exercises')).toBe(true);
    expect(items.some((item) => item.href === '/admin/athletes')).toBe(false);
  });

  it('allows admin access to admin-v2 paths', () => {
    expect(canRoleAccessPath('admin', '/admin-v2/exercises')).toBe(true);
    expect(canRoleAccessPath('admin', '/admin-v2/athletes/1/nutrition')).toBe(true);
  });

  it('still allows admin access to legacy admin paths during redirect window', () => {
    expect(canRoleAccessPath('admin', '/admin/routines')).toBe(true);
  });
});

describe('role-routes trainer cutover', () => {
  it('sends trainer home to trainer-v2', () => {
    expect(getHomeRouteForRole('trainer')).toBe('/trainer-v2');
  });

  it('exposes trainer-v2 navigation items for trainer role', () => {
    const items = getNavItemsForRole('trainer');
    expect(items[0]?.href).toBe('/trainer-v2');
    expect(items.some((item) => item.href === '/trainer-v2/exercises')).toBe(true);
    expect(items.some((item) => item.href === '/trainer/athletes')).toBe(false);
  });

  it('allows trainer access to trainer-v2 paths', () => {
    expect(canRoleAccessPath('trainer', '/trainer-v2/exercises')).toBe(true);
    expect(canRoleAccessPath('trainer', '/trainer-v2/athletes/1/nutrition')).toBe(true);
  });

  it('still allows trainer access to legacy trainer paths during redirect window', () => {
    expect(canRoleAccessPath('trainer', '/trainer/routines')).toBe(true);
  });
});
