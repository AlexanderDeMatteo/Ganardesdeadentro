'use client';

import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { useMemberships } from '@/hooks/use-memberships';
import { useAuth } from '@/app/context/auth-context';
import { isApiMembershipsSource } from '@/lib/api/config';
import { membershipNameToPlanId, subscribeMembership } from '@/lib/data/client';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AthletePrimeMemberships() {
  const { plans, isLoading } = useMemberships();
  const { user, refreshSession } = useAuth();
  const router = useRouter();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlanId = user?.membership
    ? membershipNameToPlanId(user.membership.name)
    : undefined;

  const handleSelectPlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    setError(null);
    setSubscribing(planId);

    try {
      if (isApiMembershipsSource()) {
        await subscribeMembership(planId);
        await refreshSession();
        router.push('/dashboard');
        return;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const updatedUser = {
        ...user,
        membership: {
          id: planId,
          name: plan.name,
          startDate: new Date().toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          daysRemaining: plan.durationDays,
          price: plan.price,
          features: plan.features,
        },
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo suscribir al plan';
      setError(message);
    } finally {
      setSubscribing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PrimePageHeader title="Elige tu Plan" subtitle="Cargando planes disponibles…" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg gp-bg-surface-high" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Elige tu Plan"
        subtitle="Selecciona el plan que mejor se adapte a tus objetivos de fitness"
      />

      {user?.membership && (
        <p className="gp-mono text-center text-sm gp-text-phosphor">
          Plan actual: {user.membership.name} · {user.membership.daysRemaining} días restantes
        </p>
      )}
      {error && (
        <p className="gp-mono text-center text-sm text-[var(--gp-error)]" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const isBusy = subscribing === plan.id;

          return (
            <PrimeModule key={plan.id} modId={`M${plan.id.slice(0, 2).toUpperCase()}`} title={plan.name.toUpperCase()}>
              <div className="space-y-6 p-4">
                {isCurrentPlan && (
                  <span className="gp-mono inline-block rounded-full bg-[var(--gp-phosphor)] px-3 py-1 text-[10px] font-bold uppercase text-[#003906]">
                    Plan actual
                  </span>
                )}

                <div className="inline-flex rounded-lg gp-bg-surface-variant p-3 gp-text-phosphor">
                  <CreditCard className="h-6 w-6" aria-hidden />
                </div>

                <p className="text-sm gp-text-muted">{plan.description}</p>

                <div className="border-b gp-border-outline pb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="gp-metric text-4xl gp-text-primary">${plan.price}</span>
                    <span className="gp-text-muted">por {plan.durationDays} días</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm gp-text-muted">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 gp-text-phosphor" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <PrimeChamferButton
                  type="button"
                  className="w-full"
                  disabled={isCurrentPlan || isBusy}
                  onClick={() => void handleSelectPlan(plan.id)}
                >
                  {isCurrentPlan ? (
                    'Tu plan actual'
                  ) : isBusy ? (
                    'Procesando…'
                  ) : (
                    <>
                      Seleccionar plan
                      <ArrowRight className="size-4" aria-hidden />
                    </>
                  )}
                </PrimeChamferButton>
              </div>
            </PrimeModule>
          );
        })}
      </div>
    </div>
  );
}
