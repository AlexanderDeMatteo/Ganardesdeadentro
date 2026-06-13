/**
 * Gating centralizado para capacidades Titan (IA).
 *
 * - Nutrición Titan: Premium, Pro o admin (cliente y servidor en modo API).
 * - Motivación / session-review: usuarios autenticados activos (user, trainer, admin).
 */

export const TITAN_NUTRITION_TIERS = ['Premium', 'Pro'] as const;

export type TitanNutritionTier = (typeof TITAN_NUTRITION_TIERS)[number];

export type TitanMembershipName = 'Básica' | 'Premium' | 'Pro';

export type TitanUser = {
  role?: string;
  membership?: { name?: string };
} | null;

export function hasTitanNutritionAccess(user: TitanUser): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const tier = user.membership?.name;
  return tier === 'Premium' || tier === 'Pro';
}

export function isProMember(user: TitanUser): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.membership?.name === 'Pro';
}

export function hasTitanMotivationAccessForRole(
  role: string,
): role is 'user' | 'trainer' | 'admin' {
  return role === 'user' || role === 'trainer' || role === 'admin';
}

/** Motivación y reseña de sesión: cualquier usuario autenticado (UX cliente). */
export function hasTitanMotivationAccess(isAuthenticated: boolean): boolean {
  return isAuthenticated;
}

export function isTitanNutritionTier(tier: unknown): tier is TitanNutritionTier {
  return typeof tier === 'string' && (TITAN_NUTRITION_TIERS as readonly string[]).includes(tier);
}
