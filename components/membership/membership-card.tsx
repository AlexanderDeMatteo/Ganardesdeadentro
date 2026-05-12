'use client';

import { useAuth } from '@/app/context/auth-context';
import { MetricsQuickAccess } from './metrics-quick-access';
import Link from 'next/link';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MembershipCardVariant = 'default' | 'brutalist';

export function MembershipCard({ variant = 'default' }: { variant?: MembershipCardVariant }) {
  const { user } = useAuth();

  if (!user || !user.membership || user.role === 'admin') {
    return null;
  }

  const membership = user.membership;
  const daysRemaining = membership.daysRemaining;
  const isExpiringSoon = daysRemaining <= 7;
  const isExpired = daysRemaining <= 0;

  const getMembershipColor = (name: string) => {
    switch (name) {
      case 'Básica':
        return 'from-secondary to-primary';
      case 'Premium':
        return 'from-secondary to-accent';
      case 'Pro':
        return 'from-accent to-primary';
      default:
        return 'from-primary to-secondary';
    }
  };

  const getStatusColor = () => {
    if (variant === 'brutalist') {
      if (isExpired) return 'border-2 border-destructive bg-destructive/5';
      if (isExpiringSoon) return 'border-2 border-orange-500 bg-orange-500/5';
      return 'border-2 border-secondary bg-card';
    }
    if (isExpired) return 'border border-destructive/30 bg-destructive/5';
    if (isExpiringSoon) return 'border border-orange-500/30 bg-orange-500/5';
    return 'border border-secondary/20 brand-card';
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (isExpiringSoon) return <AlertCircle className="h-5 w-5 text-orange-500" />;
    return <CheckCircle2 className="h-5 w-5 text-primary" />;
  };

  const isBrutalist = variant === 'brutalist';

  return (
    <div
      className={cn(
        'p-6 backdrop-blur-sm transition-all duration-300',
        isBrutalist ? 'rounded-none' : 'rounded-2xl',
        getStatusColor(),
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'bg-gradient-to-br p-3 text-white',
                isBrutalist ? 'rounded-none' : 'rounded-xl',
                getMembershipColor(membership.name),
              )}
            >
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-medium text-muted-foreground',
                  isBrutalist && 'dm-label text-xs font-bold uppercase tracking-widest',
                )}
              >
                Plan actual
              </p>
              <h3
                className={cn(
                  'text-2xl font-black uppercase tracking-tight text-foreground',
                  isBrutalist && 'dm-display text-2xl',
                )}
              >
                {membership.name}
              </h3>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        {/* Days Remaining */}
        <div className={cn('space-y-2 bg-background/50 p-4', isBrutalist ? 'rounded-none border border-border' : 'rounded-xl')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Tiempo restante</span>
            </div>
            <span className={`text-sm font-semibold ${
              isExpired
                ? 'text-destructive'
                : isExpiringSoon
                  ? 'text-orange-500'
                  : 'text-primary'
            }`}>
              {isExpired ? 'Expirado' : `${daysRemaining} días`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className={cn('h-2 w-full overflow-hidden bg-border', isBrutalist ? 'rounded-none' : 'rounded-full')}>
            <div
              className={cn(
                'h-full transition-all duration-300',
                isBrutalist ? 'rounded-none' : 'rounded-full',
                isExpired
                  ? 'bg-destructive'
                  : isExpiringSoon
                    ? 'bg-orange-500'
                    : 'bg-gradient-to-r from-primary to-secondary',
              )}
              style={{ width: `${Math.max(0, (daysRemaining / 365) * 100)}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Vence el {new Date(membership.endDate).toLocaleDateString('es-ES')}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Incluye:</p>
          <div className="space-y-1">
            {membership.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                {isBrutalist ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 scale-90 text-primary" />
                ) : (
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Quick Access */}
        <MetricsQuickAccess />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:space-y-0">
          {!isExpired && (
            <Link href="/metrics" className="flex-1">
              <Button
                className={cn(
                  'w-full text-sm',
                  isBrutalist &&
                    'dm-label rounded-none uppercase tracking-widest shadow-[4px_4px_0_0_var(--brand-cyan)]',
                )}
              >
                Ver métricas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}

          <Link href="/memberships" className="flex-1">
            {isExpiringSoon || isExpired ? (
              <Button
                className={cn(
                  'w-full bg-gradient-to-r from-orange-500 to-red-500 text-sm text-white hover:shadow-lg',
                  isBrutalist && 'dm-label rounded-none uppercase tracking-widest',
                )}
              >
                Renovar plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className={cn(
                  'w-full border-secondary text-sm text-secondary hover:bg-secondary/10',
                  isBrutalist &&
                    'dm-label rounded-none border-2 uppercase tracking-widest hover:bg-secondary hover:text-background',
                )}
              >
                Cambiar plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </Link>
        </div>

        {isExpired && (
          <div className={cn('border border-destructive/20 bg-destructive/10 p-3', isBrutalist ? 'rounded-none' : 'rounded-lg')}>
            <p className="text-xs font-semibold text-destructive">
              Tu membresía ha expirado. Renuévala para continuar accediendo a todas las funciones.
            </p>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className={cn('border border-orange-500/20 bg-orange-500/10 p-3', isBrutalist ? 'rounded-none' : 'rounded-lg')}>
            <p className="text-xs font-semibold text-orange-600">
              Tu membresía vence pronto. Renuévala para no perder acceso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
