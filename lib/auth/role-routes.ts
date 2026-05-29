import type { User } from '@/app/context/auth-context';

export type UserRole = User['role'];

export interface RoleNavItem {
  href: string;
  label: string;
  /** Match only exact path (e.g. /admin, /trainer dashboard) */
  exact?: boolean;
}

export const ATHLETE_NAV_ITEMS: RoleNavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/routines', label: 'Rutinas' },
  { href: '/metrics', label: 'Métricas' },
  { href: '/nutrition', label: 'Nutrición' },
  { href: '/memberships', label: 'Membresías' },
];

export const ADMIN_NAV_ITEMS: RoleNavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/athletes', label: 'Atletas' },
  { href: '/admin/trainers', label: 'Entrenadores' },
  { href: '/admin/routines', label: 'Rutinas' },
  { href: '/admin/assignments', label: 'Asignaciones' },
  { href: '/admin/memberships', label: 'Membresías' },
];

export const TRAINER_NAV_ITEMS: RoleNavItem[] = [
  { href: '/trainer', label: 'Dashboard', exact: true },
  { href: '/trainer/athletes', label: 'Mis atletas' },
  { href: '/trainer/routines', label: 'Rutinas' },
  { href: '/trainer/assignments', label: 'Asignaciones' },
  { href: '/trainer/progress', label: 'Progreso' },
  { href: '/trainer/profile', label: 'Perfil' },
];

const ATHLETE_ROUTE_PREFIXES = [
  '/dashboard',
  '/routines',
  '/metrics',
  '/nutrition',
  '/memberships',
  '/profile',
] as const;

const ADMIN_ROUTE_PREFIXES = ['/admin'] as const;
const TRAINER_ROUTE_PREFIXES = ['/trainer'] as const;

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'trainer':
      return '/trainer';
    default:
      return '/dashboard';
  }
}

export function getRedirectForWrongRole(role: UserRole): string {
  return getHomeRouteForRole(role);
}

export function getAllowedRoutePrefixesForRole(role: UserRole): readonly string[] {
  switch (role) {
    case 'admin':
      return [...ADMIN_ROUTE_PREFIXES, ...ATHLETE_ROUTE_PREFIXES];
    case 'trainer':
      return TRAINER_ROUTE_PREFIXES;
    default:
      return ATHLETE_ROUTE_PREFIXES;
  }
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return getAllowedRoutePrefixesForRole(role).some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function getNavItemsForRole(role: UserRole): RoleNavItem[] {
  switch (role) {
    case 'admin':
      return ADMIN_NAV_ITEMS;
    case 'trainer':
      return TRAINER_NAV_ITEMS;
    default:
      return ATHLETE_NAV_ITEMS;
  }
}

export function isNavItemActive(pathname: string, item: RoleNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function navItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard-');
  }
  if (href === '/admin') {
    return pathname === '/admin';
  }
  if (href === '/trainer') {
    return pathname === '/trainer';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
