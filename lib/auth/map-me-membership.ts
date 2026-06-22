import type { MeMembershipResponse } from '@/lib/api/contracts/auth';
import type { Membership, MembershipFunctionalTier } from '@/lib/auth/auth-types';

const CANONICAL_NAMES: Record<MembershipFunctionalTier, Membership['displayName']> = {
  basic: 'Básica',
  premium: 'Premium',
  pro: 'Pro',
};

function normalizeFunctionalTier(value: unknown): MembershipFunctionalTier {
  const tier = String(value ?? 'basic').toLowerCase();
  if (tier === 'premium' || tier === 'pro') return tier;
  return 'basic';
}

function inferTierFromPlanName(name: string): MembershipFunctionalTier {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('premium')) return 'premium';
  if (normalized.includes('básica') || normalized.includes('basica') || normalized.includes('basic')) {
    return 'basic';
  }
  return 'basic';
}

export function mapMeMembership(
  membership: MeMembershipResponse | null | undefined,
): Membership | undefined {
  if (!membership) return undefined;

  const daysRemaining = Math.max(0, membership.daysRemaining ?? 0);
  if (daysRemaining <= 0) return undefined;

  const functionalTier = membership.functionalTier
    ? normalizeFunctionalTier(membership.functionalTier)
    : inferTierFromPlanName(membership.name);

  return {
    id: membership.planId,
    name: membership.name,
    displayName: CANONICAL_NAMES[functionalTier],
    functionalTier,
    startDate: membership.startDate ?? '',
    endDate: membership.endDate ?? '',
    daysRemaining,
    price: membership.price ?? 0,
    features: membership.features ?? [],
    durationDays: membership.durationDays,
  };
}
