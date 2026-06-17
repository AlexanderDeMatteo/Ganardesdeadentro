'use client';

import type { MembershipPlan } from '@/hooks/use-memberships';
import { PrimeMembershipBadge } from '@/components/admin-v2/prime-membership-badge';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { cn } from '@/lib/utils';
import { CreditCard, Pencil, Trash2 } from 'lucide-react';

const TIER_LABELS: Record<MembershipPlan['functionalTier'], string> = {
  basic: 'Básico',
  premium: 'Premium',
  pro: 'Pro',
};

const COLOR_ACCENT: Record<MembershipPlan['color'], string> = {
  blue: 'border-[var(--gp-secondary-fixed)]/40 text-[var(--gp-secondary-fixed)]',
  purple: 'border-purple-400/40 text-purple-300',
  amber: 'border-[#ffb74d]/40 text-[#ffb74d]',
};

type PrimeMembershipPlanCardProps = {
  plan: MembershipPlan;
  onEdit: () => void;
  onDelete: () => void;
};

export function PrimeMembershipPlanCard({ plan, onEdit, onDelete }: PrimeMembershipPlanCardProps) {
  return (
    <article
      className={cn(
        'gp-module rounded-lg border p-5 transition-all hover:gp-phosphor-glow',
        'gp-border-outline',
      )}
    >
      <div
        className={cn(
          'mb-4 inline-flex rounded-lg border p-2',
          COLOR_ACCENT[plan.color],
        )}
      >
        <CreditCard className="h-5 w-5" aria-hidden />
      </div>

      <h3 className="gp-display text-lg gp-text-primary">{plan.name}</h3>
      <p className="gp-mono mt-1 text-xs gp-text-dim">
        Nivel {TIER_LABELS[plan.functionalTier]}
      </p>

      <div className="mt-3 mb-4">
        <PrimeMembershipBadge level={plan.functionalTier} />
      </div>

      <p className="gp-metric text-3xl gp-text-phosphor">
        ${plan.price}
        <span className="gp-mono ml-1 text-sm gp-text-muted">/{plan.durationDays}d</span>
      </p>

      <p className="gp-mono mt-3 text-sm gp-text-muted">{plan.description}</p>

      <ul className="mt-4 space-y-2">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="gp-mono flex items-start gap-2 text-xs gp-text-primary">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--gp-phosphor)]" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="gp-mono flex items-center justify-center gap-1 rounded border gp-border-outline px-3 py-2 text-xs gp-text-muted hover:gp-text-phosphor"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="gp-mono flex items-center justify-center gap-1 rounded border border-[#ffb4ab]/30 px-3 py-2 text-xs text-[#ffb4ab]/80 hover:text-[#ffb4ab]"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Eliminar
        </button>
      </div>
    </article>
  );
}

type PrimeMembershipPlansGridProps = {
  plans: MembershipPlan[];
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (planId: string) => void;
};

export function PrimeMembershipPlansGrid({ plans, onEdit, onDelete }: PrimeMembershipPlansGridProps) {
  return (
    <PrimeModule modId="51" title="PLANES_MEMBRESÍA">
      <div className="p-4 sm:p-5">
        {plans.length === 0 ? (
          <p className="gp-mono py-8 text-center text-sm gp-text-muted">Sin planes configurados</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PrimeMembershipPlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => onEdit(plan)}
                onDelete={() => onDelete(plan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PrimeModule>
  );
}
