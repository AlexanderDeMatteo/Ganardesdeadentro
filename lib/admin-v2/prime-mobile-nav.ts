import type { RoleNavItem } from '@/lib/auth/role-routes';

export const ATHLETE_MOBILE_DOCK_HREFS = [
  '/dashboard',
  '/routines',
  '/metrics',
  '/profile',
] as const;

export const TRAINER_MOBILE_DOCK_HREFS = [
  '/trainer-v2',
  '/trainer-v2/athletes',
  '/trainer-v2/assignments',
  '/trainer-v2/profile',
] as const;

export function getPrimeMobileDockItems(
  navItems: RoleNavItem[],
  preferredHrefs: readonly string[],
): RoleNavItem[] {
  const picked: RoleNavItem[] = [];
  const seen = new Set<string>();

  for (const href of preferredHrefs) {
    const item = navItems.find((entry) => entry.href === href);
    if (item && !seen.has(item.href)) {
      picked.push(item);
      seen.add(item.href);
    }
    if (picked.length >= 4) break;
  }

  if (picked.length < 4) {
    for (const item of navItems) {
      if (seen.has(item.href)) continue;
      picked.push(item);
      seen.add(item.href);
      if (picked.length >= 4) break;
    }
  }

  return picked;
}

export function getPrimeMobileOverflowItems(
  navItems: RoleNavItem[],
  dockItems: RoleNavItem[],
): RoleNavItem[] {
  const dockHrefs = new Set(dockItems.map((item) => item.href));
  return navItems.filter((item) => !dockHrefs.has(item.href));
}
