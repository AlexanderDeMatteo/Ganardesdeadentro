'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useMemberships } from '@/hooks/use-memberships';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

function MembershipsContent() {
  const { plans } = useMemberships();
  const { user } = useAuth();

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

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
  };

  const colorMap: Record<string, string> = {
    blue: 'from-secondary to-primary',
    purple: 'from-secondary to-accent',
    amber: 'from-accent to-primary',
  };

  const currentPlanId = user?.membership?.id;

  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <p className="brand-kicker">Acceso elite</p>
            <h1 className="brand-title text-5xl font-black text-foreground sm:text-6xl">
              Elige tu Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona el plan que mejor se adapte a tus objetivos de fitness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => {
              const isCurrentPlan = currentPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`brand-card brand-card-hover relative rounded-2xl p-8 ${
                    isCurrentPlan
                      ? 'border-primary shadow-lg'
                      : ''
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-6 rounded-full bg-primary px-4 py-1 text-xs font-black uppercase tracking-[0.12em] text-primary-foreground">
                      Plan Actual
                    </div>
                  )}

                  <div className={`inline-flex rounded-lg bg-gradient-to-br ${colorMap[plan.color]} p-3 text-white mb-6`}>
                    <CreditCard className="h-6 w-6" />
                  </div>

                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6 h-12">{plan.description}</p>

                  <div className="mb-8 pb-8 border-b border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">por {plan.durationDays} días</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
                      isCurrentPlan
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Tu Plan Actual'
                    ) : (
                      <>
                        Seleccionar Plan
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="brand-card mx-auto mt-20 max-w-4xl rounded-2xl p-12">
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">¿Cambiar de plan?</h2>
            <p className="text-muted-foreground mb-6">
              Puedes cambiar tu plan en cualquier momento. El nuevo plan comenzará inmediatamente y el cambio se reflejará en tu dashboard.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-black uppercase tracking-tight text-foreground">Planes Mensuales</h3>
                <p className="text-sm text-muted-foreground">Todos nuestros planes se renuevan cada 30 días</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-black uppercase tracking-tight text-foreground">Sin Compromiso</h3>
                <p className="text-sm text-muted-foreground">Cancela cuando quieras directamente desde tu perfil</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function MembershipsPage() {
  return (
    <ProtectedRoute>
      <MembershipsContent />
    </ProtectedRoute>
  );
}
