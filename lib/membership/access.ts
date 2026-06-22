import type { Membership } from '@/lib/auth/auth-types';

export const ATHLETE_ROUTES_WITHOUT_MEMBERSHIP = [
  '/dashboard',
  '/memberships',
  '/profile',
  '/support',
] as const;

export function getMembershipDaysRemaining(membership?: Membership | null): number {
  if (!membership) return 0;
  return Math.max(0, membership.daysRemaining ?? 0);
}

export function hasActiveAthleteMembership(membership?: Membership | null): boolean {
  return getMembershipDaysRemaining(membership) > 0;
}

export function canAthleteAccessPath(pathname: string, daysRemaining: number): boolean {
  if (daysRemaining > 0) return true;
  const normalized = pathname.split('?')[0] ?? pathname;
  return ATHLETE_ROUTES_WITHOUT_MEMBERSHIP.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function filterAthleteNavForMembership<T extends { href: string }>(
  items: T[],
  daysRemaining: number,
): T[] {
  if (daysRemaining > 0) return items;
  return items.filter((item) =>
    ATHLETE_ROUTES_WITHOUT_MEMBERSHIP.some(
      (allowed) => item.href === allowed || item.href.startsWith(`${allowed}/`),
    ),
  );
}
