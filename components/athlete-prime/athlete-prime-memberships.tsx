'use client';

import { MembershipCheckoutForm } from '@/components/membership/checkout/membership-checkout-form';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { useMemberships } from '@/hooks/use-memberships';
import { useAuth } from '@/app/context/auth-context';
import { usePaymentCheckout } from '@/hooks/use-payment-checkout';
import { hasActiveAthleteMembership } from '@/lib/membership/access';
import { membershipNameToPlanId } from '@/lib/data/client';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AthletePrimeMemberships() {
  const { plans, isLoading } = useMemberships();
  const { user } = useAuth();
  const { pendingRequest, refresh } = usePaymentCheckout(user?.id);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [checkoutDone, setCheckoutDone] = useState(false);

  const currentPlanId = user?.membership
    ? membershipNameToPlanId(user.membership.displayName)
    : undefined;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const hasActive = hasActiveAthleteMembership(user?.membership);

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

  if (checkoutDone) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border gp-border-outline gp-bg-surface-high p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 gp-text-phosphor" aria-hidden />
        <h2 className="gp-mono text-xl font-bold gp-text-primary">Solicitud enviada</h2>
        <p className="text-sm gp-text-muted">
          Tu comprobante fue recibido. Te notificaremos cuando un administrador valide tu pago.
        </p>
        <PrimeChamferButton type="button" onClick={() => setCheckoutDone(false)}>
          Ver mis planes
        </PrimeChamferButton>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="space-y-6">
        <PrimePageHeader
          title="Checkout"
          subtitle={`Plan seleccionado: ${selectedPlan.name}`}
        />
        <MembershipCheckoutForm
          plan={selectedPlan}
          onBack={() => setSelectedPlanId(null)}
          onSuccess={() => {
            void refresh();
            setSelectedPlanId(null);
            setCheckoutDone(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Elige tu Plan"
        subtitle="Selecciona el plan y completa el pago con comprobante para activar tu membresía"
      />

      {pendingRequest && (
        <div className="rounded-xl border border-[#d4a853]/40 bg-[#faf6ee]/10 p-4 text-sm gp-text-muted">
          Tienes un pago pendiente de validación para{' '}
          <strong className="gp-text-phosphor">{pendingRequest.planName}</strong>.
        </div>
      )}

      {user?.membership && hasActive && (
        <p className="gp-mono text-center text-sm gp-text-phosphor">
          Plan actual: {user.membership.name} · {user.membership.daysRemaining} días restantes
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = hasActive && currentPlanId === plan.id;
          const isBlocked = Boolean(pendingRequest);

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
                  disabled={isCurrentPlan || isBlocked}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  {isCurrentPlan ? (
                    'Tu plan actual'
                  ) : isBlocked ? (
                    'Pago en revisión'
                  ) : (
                    <>
                      Continuar al pago
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
