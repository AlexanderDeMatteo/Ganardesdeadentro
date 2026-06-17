/**
 * Mapa de redirección admin legacy → Phosphor V2.
 * Debe mantenerse alineado con `redirects()` en next.config.mjs.
 */
export const ADMIN_LEGACY_TO_V2_REDIRECTS: Record<string, string> = {
  '/admin': '/admin-v2',
  '/admin/athletes': '/admin-v2/athletes',
  '/admin/trainers': '/admin-v2/trainers',
  '/admin/routines': '/admin-v2/routines',
  '/admin/assignments': '/admin-v2/assignments',
  '/admin/memberships': '/admin-v2/memberships',
};

export function resolveAdminNutritionRedirect(athleteId: string): string {
  return `/admin-v2/athletes/${encodeURIComponent(athleteId)}/nutrition`;
}

export function resolveAdminV2Redirect(legacyPath: string): string | null {
  const normalized = legacyPath.split('?')[0] ?? legacyPath;
  if (normalized in ADMIN_LEGACY_TO_V2_REDIRECTS) {
    return ADMIN_LEGACY_TO_V2_REDIRECTS[normalized];
  }
  const nutritionMatch = /^\/admin\/athletes\/([^/]+)\/nutrition$/.exec(normalized);
  if (nutritionMatch?.[1]) {
    return resolveAdminNutritionRedirect(nutritionMatch[1]);
  }
  return null;
}

export const ADMIN_V2_ONLY_PATHS = [
  '/admin-v2/exercises',
] as const;
