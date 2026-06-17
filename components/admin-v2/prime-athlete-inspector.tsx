'use client';

import type { AthleteProfile } from '@/hooks/use-admin';
import type { Trainer } from '@/lib/data/types';
import { PrimeInspectorCta } from '@/components/admin-v2/prime-inspector-cta';
import { PrimeMembershipBadge } from '@/components/admin-v2/prime-membership-badge';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { getInitials } from '@/lib/admin-v2/get-initials';
import {
  formatLatestMetric,
  formatPrimeAgeDetail,
  formatPrimeField,
} from '@/lib/admin-v2/format-prime-field';
import { cn } from '@/lib/utils';
import { AlertTriangle, ClipboardList, TrendingUp, UserRound, UtensilsCrossed } from 'lucide-react';

const EMPTY_BIOMETRY = new Set(['Sin registrar', 'No indicada', 'No indicado', '—']);

type PrimeAthleteInspectorProps = {
  athlete: AthleteProfile;
  getTrainerById?: (id: string) => Trainer | undefined;
  getRoutineLabel?: (athleteId: string) => string;
  mode?: 'admin' | 'trainer';
  nutritionBasePath?: string;
  onViewProfile: () => void;
  onViewPerformance: () => void;
  onAssignTrainer?: () => void;
};

function formatGender(gender: string): string {
  if (gender === 'M') return 'Masculino';
  if (gender === 'F') return 'Femenino';
  if (!gender || gender.toLowerCase() === 'unknown') return 'No indicado';
  return gender;
}

function BiometryCell({ label, value }: { label: string; value: string }) {
  const isWarning = EMPTY_BIOMETRY.has(value);

  return (
    <div className="flex flex-col gap-1 rounded border gp-border-outline/40 p-3">
      <span className="gp-label gp-text-dim">{label}</span>
      <span
        className={cn(
          'gp-mono text-sm',
          isWarning ? 'flex items-center gap-1.5 text-[#ffb4ab]/80' : 'gp-text-primary',
        )}
      >
        {isWarning ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>[!] {value}</span>
          </>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

export function PrimeAthleteInspector({
  athlete,
  getTrainerById,
  getRoutineLabel,
  mode = 'admin',
  nutritionBasePath = '/admin-v2/athletes',
  onViewProfile,
  onViewPerformance,
  onAssignTrainer,
}: PrimeAthleteInspectorProps) {
  const trainer =
    mode === 'admin' && getTrainerById && athlete.trainerId
      ? getTrainerById(athlete.trainerId)
      : undefined;
  const hasTrainer = mode === 'admin' ? Boolean(athlete.trainerId && trainer) : true;
  const metrics = athlete.latestMetric ?? athlete.metrics;
  const lastMetric = formatLatestMetric(metrics);
  const lastMetricEmpty = lastMetric === '—';

  const biometry = [
    { label: 'Edad', value: formatPrimeAgeDetail(athlete.age) },
    { label: 'Género', value: formatGender(athlete.gender) },
    { label: 'Peso', value: formatPrimeField(athlete.weight, 'kg', 'Sin registrar') },
    { label: 'Altura', value: formatPrimeField(athlete.height, 'cm', 'Sin registrar') },
  ];

  return (
    <PrimeModule modId={mode === 'trainer' ? 'TRN-12' : '12'} title="INSPECTOR_ATLETA" className="flex h-full flex-col">
      <div className="flex items-start gap-4 border-b gp-border-outline/40 p-4">
        <div className="relative shrink-0">
          <div
            className={cn(
              'gp-chamfer flex h-16 w-16 items-center justify-center',
              'border border-[#255831] bg-[#0d1511]',
            )}
          >
            <span className="gp-mono text-lg font-bold gp-text-phosphor">
              {getInitials(athlete.name)}
            </span>
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d1511]',
              hasTrainer
                ? 'bg-[var(--gp-phosphor-core)] gp-pulse-hardware'
                : 'bg-[#ffb4ab]',
            )}
            aria-label={hasTrainer ? 'Entrenador asignado' : 'Sin entrenador'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="gp-display truncate text-lg gp-text-primary">{athlete.name}</h3>
          <p className="gp-mono mt-1 text-xs gp-text-muted">ID // {athlete.id.slice(0, 8)}</p>
          <p className="gp-mono mt-2 text-[10px] uppercase tracking-wider gp-text-dim">
            {mode === 'trainer'
              ? `• ${getRoutineLabel?.(athlete.id) ?? 'Sin rutina'}`
              : hasTrainer
                ? '• Enlace activo'
                : '• Sin enlace'}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <section>
          <p className="gp-label mb-2 gp-text-phosphor">Datos de cuenta</p>
          <dl className="space-y-2">
            {[
              { label: 'Email', value: athlete.email },
              { label: 'ID', value: athlete.id.slice(0, 8) },
              {
                label: 'Alta',
                value: athlete.joinDate
                  ? new Date(athlete.joinDate).toLocaleDateString('es-ES')
                  : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="gp-mono text-xs uppercase gp-text-dim">{label}</dt>
                <dd className="gp-mono text-right text-sm normal-case text-gray-300">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <p className="gp-label mb-2 gp-text-phosphor">Biometría</p>
          <div className="grid grid-cols-2 gap-2 rounded-lg border gp-border-outline bg-[#0d1511] p-2">
            {biometry.map((cell) => (
              <BiometryCell key={cell.label} label={cell.label} value={cell.value} />
            ))}
          </div>
        </section>

        <section>
          <p className="gp-label mb-2 gp-text-phosphor">Plataforma</p>
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <dt className="gp-mono text-xs uppercase gp-text-dim">Membresía</dt>
              <dd>
                <PrimeMembershipBadge level={athlete.membershipLevel} />
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="gp-mono text-xs uppercase gp-text-dim">
                {mode === 'trainer' ? 'Rutina activa' : 'Entrenador'}
              </dt>
              <dd
                className={cn(
                  'gp-mono text-right text-sm',
                  mode === 'trainer'
                    ? 'gp-text-primary'
                    : hasTrainer
                      ? 'gp-text-phosphor'
                      : 'text-[#ffb4ab]/80',
                )}
              >
                {mode === 'trainer'
                  ? (getRoutineLabel?.(athlete.id) ?? 'Sin rutina')
                  : (trainer?.name ?? 'Sin asignar')}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="gp-mono text-xs uppercase gp-text-dim">Última métrica</dt>
              <dd
                className={cn(
                  'gp-metric text-right text-sm',
                  lastMetricEmpty ? 'text-[#ffb4ab]/80' : 'gp-text-primary',
                )}
              >
                {lastMetricEmpty ? '[!] Sin registro' : lastMetric}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <footer className="grid grid-cols-1 gap-2 border-t gp-border-outline p-4">
        <PrimeInspectorCta href={`${nutritionBasePath}/${athlete.id}/nutrition`}>
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
          Nutrición
        </PrimeInspectorCta>
        <PrimeInspectorCta onClick={onViewPerformance}>
          <TrendingUp className="h-4 w-4" aria-hidden />
          Desempeño
        </PrimeInspectorCta>
        <PrimeInspectorCta onClick={onViewProfile}>
          <UserRound className="h-4 w-4" aria-hidden />
          Ficha completa
        </PrimeInspectorCta>
        {mode === 'admin' && onAssignTrainer ? (
          <PrimeInspectorCta onClick={onAssignTrainer}>
            <ClipboardList className="h-4 w-4" aria-hidden />
            {hasTrainer ? 'Reasignar' : 'Asignar'}
          </PrimeInspectorCta>
        ) : null}
      </footer>
    </PrimeModule>
  );
}
