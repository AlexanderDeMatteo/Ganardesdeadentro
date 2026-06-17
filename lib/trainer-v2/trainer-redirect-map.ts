/**
 * Mapa de redirección trainer legacy → Gainer Prime V2.
 * Debe mantenerse alineado con `redirects()` en next.config.mjs.
 */
export const TRAINER_LEGACY_TO_V2_REDIRECTS: Record<string, string> = {
  '/trainer': '/trainer-v2',
  '/trainer/athletes': '/trainer-v2/athletes',
  '/trainer/routines': '/trainer-v2/routines',
  '/trainer/exercises': '/trainer-v2/exercises',
  '/trainer/assignments': '/trainer-v2/assignments',
  '/trainer/progress': '/trainer-v2/progress',
  '/trainer/profile': '/trainer-v2/profile',
};

export function resolveTrainerNutritionRedirect(athleteId: string): string {
  return `/trainer-v2/athletes/${encodeURIComponent(athleteId)}/nutrition`;
}

export function resolveTrainerV2Redirect(legacyPath: string): string | null {
  const normalized = legacyPath.split('?')[0] ?? legacyPath;
  if (normalized in TRAINER_LEGACY_TO_V2_REDIRECTS) {
    return TRAINER_LEGACY_TO_V2_REDIRECTS[normalized];
  }
  const nutritionMatch = /^\/trainer\/athletes\/([^/]+)\/nutrition$/.exec(normalized);
  if (nutritionMatch?.[1]) {
    return resolveTrainerNutritionRedirect(nutritionMatch[1]);
  }
  return null;
}
