import type { User } from '@/app/context/auth-context';

export type UserRole = User['role'];

export interface RoleNavItem {
  href: string;
  label: string;
  /** Match only exact path (e.g. /admin, /trainer dashboard) */
  exact?: boolean;
}

export const ATHLETE_NAV_ITEMS: RoleNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/routines', label: 'Rutinas' },
  { href: '/metrics', label: 'Métricas' },
  { href: '/nutrition', label: 'Nutrición' },
  { href: '/memberships', label: 'Membresías' },
  { href: '/support', label: 'Soporte' },
  { href: '/profile', label: 'Perfil' },
];

export const ADMIN_NAV_ITEMS: RoleNavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/athletes', label: 'Atletas' },
  { href: '/admin/trainers', label: 'Entrenadores' },
  { href: '/admin/routines', label: 'Rutinas' },
  { href: '/admin/assignments', label: 'Asignaciones' },
  { href: '/admin/memberships', label: 'Membresías' },
];

export const ADMIN_V2_NAV_ITEMS: RoleNavItem[] = [
  { href: '/admin-v2', label: 'Dashboard', exact: true },
  { href: '/admin-v2/athletes', label: 'Atletas' },
  { href: '/admin-v2/trainers', label: 'Entrenadores' },
  { href: '/admin-v2/routines', label: 'Rutinas' },
  { href: '/admin-v2/exercises', label: 'Ejercicios' },
  { href: '/admin-v2/assignments', label: 'Asignaciones' },
  { href: '/admin-v2/memberships', label: 'Membresías' },
  { href: '/admin-v2/payment-methods', label: 'Métodos de pago' },
  { href: '/admin-v2/exchange-rates', label: 'Tasas de cambio' },
  { href: '/admin-v2/payments', label: 'Pagos' },
  { href: '/admin-v2/support', label: 'Soporte' },
];

export const ADMIN_V3_NAV_ITEMS: RoleNavItem[] = [
  { href: '/admin-v3', label: 'Dashboard', exact: true },
  { href: '/admin-v3/athletes', label: 'Atletas' },
  { href: '/admin-v3/routines', label: 'Rutinas' },
  { href: '/admin-v3/assignments', label: 'Asignaciones' },
  { href: '/admin-v3/memberships', label: 'Membresías' },
];

export const TRAINER_NAV_ITEMS: RoleNavItem[] = [
  { href: '/trainer', label: 'Dashboard', exact: true },
  { href: '/trainer/athletes', label: 'Mis atletas' },
  { href: '/trainer/routines', label: 'Rutinas' },
  { href: '/trainer/exercises', label: 'Ejercicios' },
  { href: '/trainer/assignments', label: 'Asignaciones' },
  { href: '/trainer/progress', label: 'Progreso' },
  { href: '/trainer/profile', label: 'Perfil' },
];

export const TRAINER_V2_NAV_ITEMS: RoleNavItem[] = [
  { href: '/trainer-v2', label: 'Dashboard', exact: true },
  { href: '/trainer-v2/athletes', label: 'Mis atletas' },
  { href: '/trainer-v2/routines', label: 'Rutinas' },
  { href: '/trainer-v2/exercises', label: 'Ejercicios' },
  { href: '/trainer-v2/assignments', label: 'Asignaciones' },
  { href: '/trainer-v2/progress', label: 'Progreso' },
  { href: '/trainer-v2/profile', label: 'Perfil' },
];

const ATHLETE_ROUTE_PREFIXES = [
  '/dashboard',
  '/routines',
  '/metrics',
  '/nutrition',
  '/memberships',
  '/support',
  '/profile',
] as const;

const ADMIN_ROUTE_PREFIXES = ['/admin', '/admin-v2', '/admin-v3'] as const;
const TRAINER_ROUTE_PREFIXES = ['/trainer', '/trainer-v2'] as const;

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin-v2';
    case 'trainer':
      return '/trainer-v2';
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
      return ADMIN_V2_NAV_ITEMS;
    case 'trainer':
      return TRAINER_V2_NAV_ITEMS;
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

export function isAdminV2Path(pathname: string): boolean {
  return pathname === '/admin-v2' || pathname.startsWith('/admin-v2/');
}

export function isAdminV3Path(pathname: string): boolean {
  return pathname === '/admin-v3' || pathname.startsWith('/admin-v3/');
}

export function isAdminLegacyPath(pathname: string): boolean {
  if (isAdminV2Path(pathname) || isAdminV3Path(pathname)) return false;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isAdminPanelPath(pathname: string): boolean {
  return isAdminLegacyPath(pathname) || isAdminV2Path(pathname) || isAdminV3Path(pathname);
}

export function isAdminPreviewPath(pathname: string): boolean {
  return isAdminV2Path(pathname) || isAdminV3Path(pathname);
}

export function isPublicAuthPath(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return normalized === '/login' || normalized === '/register' || normalized === '/activate';
}

export function isTrainerV2Path(pathname: string): boolean {
  return pathname === '/trainer-v2' || pathname.startsWith('/trainer-v2/');
}

export function isTrainerPreviewPath(pathname: string): boolean {
  return isTrainerV2Path(pathname);
}

export function isAthletePrimePath(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return ATHLETE_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function navItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard-');
  }
  if (href === '/admin') {
    return pathname === '/admin';
  }
  if (href === '/admin-v2') {
    return pathname === '/admin-v2';
  }
  if (href === '/admin-v3') {
    return pathname === '/admin-v3';
  }
  if (href === '/trainer') {
    return pathname === '/trainer';
  }
  if (href === '/trainer-v2') {
    return pathname === '/trainer-v2';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
