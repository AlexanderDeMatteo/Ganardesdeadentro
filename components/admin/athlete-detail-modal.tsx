'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { useAthleteMetrics } from '@/hooks/use-athlete-metrics';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ScrollableModal } from '@/components/ui/scrollable-modal';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Mail, Cake, Ruler, Weight, Calendar, UtensilsCrossed, UserRound } from 'lucide-react';
import Link from 'next/link';

interface AthleteDetailModalProps {
  athlete: AthleteProfile | null;
  onClose: () => void;
  /** Base path for nutrition editor, e.g. /admin/athletes or /trainer/athletes */
  nutritionBasePath?: string;
  /** Apply Gainer Prime visual skin (admin-v2) */
  prime?: boolean;
}

function resolveMetrics(athlete: AthleteProfile) {
  return athlete.latestMetric ?? athlete.metrics ?? null;
}

function formatOptional(
  value: number | null | undefined,
  unit: string,
  fallback = 'Sin registrar',
): string {
  if (value == null || value <= 0) return fallback;
  return `${value} ${unit}`;
}

function formatAge(value: number | null | undefined): string {
  if (value == null || value <= 0) return 'No indicada';
  return `${value} años`;
}

export function AthleteDetailModal({
  athlete,
  onClose,
  nutritionBasePath = '/admin-v2/athletes',
  prime = false,
}: AthleteDetailModalProps) {
  const { latest, isLoading } = useAthleteMetrics(athlete?.id ?? null);

  if (!athlete) return null;

  const metrics = latest ?? resolveMetrics(athlete);
  const metricDate = latest?.date ?? athlete.latestMetric?.date;
  const profileWeightLabel = 'Peso inicial (perfil)';

  const footer = prime ? (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        asChild
        variant="outline"
        className="gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor"
      >
        <Link href={`${nutritionBasePath}/${athlete.id}/nutrition`} onClick={onClose}>
          <UtensilsCrossed className="mr-2 size-4" aria-hidden />
          Nutrición
        </Link>
      </Button>
      <Button
        onClick={onClose}
        className="gp-mono rounded-full bg-[var(--gp-phosphor)] font-bold text-[#003906] hover:bg-[var(--gp-phosphor-bright)]"
      >
        Cerrar
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="outline">
        <Link href={`${nutritionBasePath}/${athlete.id}/nutrition`} onClick={onClose}>
          <UtensilsCrossed className="mr-2 size-4" aria-hidden />
          Nutrición
        </Link>
      </Button>
      <Button onClick={onClose} className="bg-gradient-to-r from-primary to-secondary">
        Cerrar
      </Button>
    </div>
  );

  const sectionTitle = prime ? 'gp-label gp-text-phosphor mb-3 block' : 'mb-4 text-lg font-semibold';
  const muted = prime ? 'gp-mono text-xs gp-text-dim' : 'text-sm text-muted-foreground';
  const value = prime ? 'gp-mono font-medium gp-text-primary' : 'font-medium';

  const modalBody = (
    <div className={prime ? 'space-y-6' : 'space-y-8'}>
        <div>
          <h3 className={sectionTitle}>Información Personal</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className={prime ? 'mt-0.5 h-5 w-5 shrink-0 gp-text-phosphor' : 'mt-0.5 h-5 w-5 shrink-0 text-primary'} />
              <div>
                <p className={muted}>Email</p>
                <p className={value}>{athlete.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cake className={prime ? 'mt-0.5 h-5 w-5 shrink-0 gp-text-phosphor' : 'mt-0.5 h-5 w-5 shrink-0 text-secondary'} />
              <div>
                <p className={muted}>Edad</p>
                <p className={value}>{formatAge(athlete.age)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserRound className={prime ? 'mt-0.5 h-5 w-5 shrink-0 gp-text-phosphor' : 'mt-0.5 h-5 w-5 shrink-0 text-primary'} />
              <div>
                <p className={muted}>Género</p>
                <p className={value}>{athlete.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className={prime ? 'mt-0.5 h-5 w-5 shrink-0 gp-text-phosphor' : 'mt-0.5 h-5 w-5 shrink-0 text-accent'} />
              <div>
                <p className={muted}>Fecha de Registro</p>
                <p className={value}>{new Date(athlete.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitle}>Medidas Físicas</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={prime ? 'flex items-start gap-3 rounded-lg gp-bg-surface-variant/30 p-4' : 'flex items-start gap-3 rounded-lg bg-secondary/5 p-4'}>
              <Weight className={prime ? 'h-5 w-5 shrink-0 gp-text-phosphor' : 'h-5 w-5 shrink-0 text-primary'} />
              <div>
                <p className={muted}>{profileWeightLabel}</p>
                <p className={prime ? 'gp-metric text-lg font-semibold gp-text-primary' : 'text-lg font-semibold'}>
                  {formatOptional(athlete.weight, 'kg')}
                </p>
              </div>
            </div>
            <div className={prime ? 'flex items-start gap-3 rounded-lg gp-bg-surface-variant/30 p-4' : 'flex items-start gap-3 rounded-lg bg-secondary/5 p-4'}>
              <Ruler className={prime ? 'h-5 w-5 shrink-0 gp-text-phosphor' : 'h-5 w-5 shrink-0 text-secondary'} />
              <div>
                <p className={muted}>Altura</p>
                <p className={prime ? 'gp-metric text-lg font-semibold gp-text-primary' : 'text-lg font-semibold'}>
                  {formatOptional(athlete.height, 'cm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitle}>Última medición</h3>
          {isLoading ? (
            <LoadingState label="Cargando métricas…" />
          ) : metrics ? (
            <>
              {metricDate && (
                <p className={prime ? 'gp-mono mb-3 text-xs gp-text-dim' : 'mb-3 text-xs text-muted-foreground'}>
                  Fecha: {new Date(metricDate).toLocaleDateString('es-ES')}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={prime ? 'rounded-lg border gp-border-outline gp-bg-surface-variant/40 p-4' : 'rounded-lg border border-primary/20 bg-primary/10 p-4'}>
                  <p className={muted}>Peso</p>
                  <p className={prime ? 'gp-metric text-2xl font-bold gp-text-phosphor' : 'text-2xl font-bold text-primary'}>
                    {metrics.weight} kg
                  </p>
                </div>
                <div className={prime ? 'rounded-lg border gp-border-outline gp-bg-surface-variant/40 p-4' : 'rounded-lg border border-secondary/20 bg-secondary/10 p-4'}>
                  <p className={muted}>Grasa Corporal</p>
                  <p className={prime ? 'gp-metric text-2xl font-bold gp-text-primary' : 'text-2xl font-bold text-secondary'}>
                    {metrics.bodyFat}%
                  </p>
                </div>
                <div className={prime ? 'rounded-lg border gp-border-outline gp-bg-surface-variant/40 p-4' : 'rounded-lg border border-accent/20 bg-accent/10 p-4'}>
                  <p className={muted}>Masa Muscular</p>
                  <p className={prime ? 'gp-metric text-2xl font-bold gp-text-primary' : 'text-2xl font-bold text-accent'}>
                    {metrics.muscleMass} kg
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className={prime ? 'gp-mono text-sm gp-text-muted' : 'text-sm text-muted-foreground'}>
              Sin métricas registradas.
            </p>
          )}
        </div>

        <div>
          <h3 className={sectionTitle}>Información de Membresía</h3>
          <div
            className={
              prime
                ? 'rounded-lg border gp-border-outline gp-bg-surface-variant/40 p-4'
                : `rounded-lg border p-4 ${
                    athlete.membershipLevel === 'pro'
                      ? 'border-primary/20 bg-primary/10'
                      : athlete.membershipLevel === 'premium'
                        ? 'border-secondary/20 bg-secondary/10'
                        : 'border-muted/20 bg-muted/10'
                  }`
            }
          >
            <p className={muted}>Tipo de Membresía</p>
            <p className={prime ? 'gp-display text-xl capitalize gp-text-primary' : 'text-xl font-semibold capitalize'}>
              {athlete.membershipLevel}
            </p>
          </div>
        </div>
      </div>
  );

  if (prime) {
    return (
      <PrimeScrollableModal
        title={athlete.name}
        onClose={onClose}
        ariaLabelledBy="athlete-detail-modal-title"
        modId="12"
        footer={footer}
        size="wide"
        fitContent
      >
        {modalBody}
      </PrimeScrollableModal>
    );
  }

  return (
    <ScrollableModal
      title={athlete.name}
      onClose={onClose}
      ariaLabelledBy="athlete-detail-modal-title"
      footer={footer}
      size="lg"
    >
      {modalBody}
    </ScrollableModal>
  );
}
