'use client';

import { useMemo, useState } from 'react';
import type { AthleteProfile } from '@/hooks/use-admin';
import { useAthletePerformance } from '@/hooks/use-athlete-performance';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { PrimePerformanceChart } from '@/components/admin-v2/prime-performance-chart';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { LoadingState } from '@/components/ui/loading-state';
import {
  PERFORMANCE_PERIOD_LABELS,
  computePeriodDelta,
  filterSessionsByPeriod,
  formatDelta,
  metricsToChartData,
  summarizeSessionPerformance,
  type PerformancePeriod,
} from '@/lib/admin-v2/athlete-performance';
import { WorkoutActivityHeatmap } from '@/components/routines/workout-activity-heatmap';
import { Activity, CalendarRange, Dumbbell, Percent, Scale } from 'lucide-react';

const PERIOD_FILTERS: { key: PerformancePeriod; label: string }[] = [
  { key: 'week', label: PERFORMANCE_PERIOD_LABELS.week },
  { key: 'month', label: PERFORMANCE_PERIOD_LABELS.month },
  { key: 'year', label: PERFORMANCE_PERIOD_LABELS.year },
];

type PrimeAthletePerformanceModalProps = {
  athlete: AthleteProfile | null;
  onClose: () => void;
  getRoutineName?: (routineId: string) => string;
};

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Scale;
}) {
  return (
    <div className="gp-form-panel flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 gp-text-phosphor" aria-hidden />
        <span className="gp-mono text-xs uppercase gp-text-dim">{label}</span>
      </div>
      <p className="gp-metric text-xl gp-text-primary">{value}</p>
      {hint ? <p className="gp-mono text-xs gp-text-phosphor">{hint}</p> : null}
    </div>
  );
}

export function PrimeAthletePerformanceModal({
  athlete,
  onClose,
  getRoutineName,
}: PrimeAthletePerformanceModalProps) {
  const [period, setPeriod] = useState<PerformancePeriod>('month');
  const { entries, latest, sessions, isLoading, error } = useAthletePerformance(athlete?.id);

  const scopedSessions = useMemo(
    () => (athlete ? filterSessionsByPeriod(sessions, period) : []),
    [athlete, sessions, period],
  );

  const routineNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const session of scopedSessions) {
      if (!map[session.routineId]) {
        map[session.routineId] = getRoutineName?.(session.routineId) ?? 'Rutina';
      }
    }
    return map;
  }, [scopedSessions, getRoutineName]);

  const sessionSummary = useMemo(
    () => summarizeSessionPerformance(scopedSessions),
    [scopedSessions],
  );

  const weightDelta = useMemo(
    () => (athlete ? computePeriodDelta(entries, 'weight', period) : null),
    [athlete, entries, period],
  );
  const fatDelta = useMemo(
    () => (athlete ? computePeriodDelta(entries, 'bodyFat', period) : null),
    [athlete, entries, period],
  );
  const muscleDelta = useMemo(
    () => (athlete ? computePeriodDelta(entries, 'muscleMass', period) : null),
    [athlete, entries, period],
  );

  const weightChart = useMemo(
    () => metricsToChartData(entries, 'weight', period),
    [entries, period],
  );
  const fatChart = useMemo(
    () => metricsToChartData(entries, 'bodyFat', period),
    [entries, period],
  );
  const muscleChart = useMemo(
    () => metricsToChartData(entries, 'muscleMass', period),
    [entries, period],
  );

  if (!athlete) return null;

  const periodLabel = PERFORMANCE_PERIOD_LABELS[period].toLowerCase();

  return (
    <PrimeScrollableModal
      title={`Desempeño — ${athlete.name}`}
      modId="15"
      onClose={onClose}
      size="full"
      align="start"
      maxWidth="max-w-[min(72rem,calc(100vw-2rem))]"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="gp-mono text-sm gp-text-muted">
            Vista {periodLabel} · métricas corporales y adherencia a entrenamientos
          </p>
          <PrimeFilterPills filters={PERIOD_FILTERS} active={period} onChange={setPeriod} />
        </div>

        {isLoading ? (
          <LoadingState label="Cargando desempeño del atleta…" />
        ) : error ? (
          <p className="gp-mono text-sm text-[#ffb4ab]" role="alert">
            {error}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Peso actual"
                value={latest?.weight != null ? `${latest.weight} kg` : '—'}
                hint={formatDelta(weightDelta, 'kg') !== '—' ? `Δ periodo ${formatDelta(weightDelta, 'kg')}` : undefined}
                icon={Scale}
              />
              <KpiCard
                label="Grasa corporal"
                value={latest?.bodyFat != null ? `${latest.bodyFat}%` : '—'}
                hint={formatDelta(fatDelta, '%') !== '—' ? `Δ periodo ${formatDelta(fatDelta, '%')}` : undefined}
                icon={Percent}
              />
              <KpiCard
                label="Masa muscular"
                value={latest?.muscleMass != null ? `${latest.muscleMass} kg` : '—'}
                hint={formatDelta(muscleDelta, 'kg') !== '—' ? `Δ periodo ${formatDelta(muscleDelta, 'kg')}` : undefined}
                icon={Dumbbell}
              />
              <KpiCard
                label="Adherencia"
                value={
                  sessionSummary.adherencePct != null
                    ? `${sessionSummary.adherencePct}%`
                    : '—'
                }
                hint={
                  sessionSummary.total > 0
                    ? `${sessionSummary.completed}/${sessionSummary.total} sesiones`
                    : 'Sin sesiones en el periodo'
                }
                icon={Activity}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <PrimePerformanceChart title="Evolución peso" data={weightChart} unit="kg" />
              <PrimePerformanceChart
                title="Evolución grasa"
                data={fatChart}
                unit="%"
                color="#83e77b"
              />
              <PrimePerformanceChart
                title="Evolución masa muscular"
                data={muscleChart}
                unit="kg"
                color="#95fa8b"
              />
            </div>

            <section className="gp-form-panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 gp-text-phosphor" aria-hidden />
                <h3 className="gp-label gp-text-phosphor">Entrenamientos del periodo</h3>
              </div>

              {scopedSessions.length === 0 ? (
                <p className="gp-mono text-sm gp-text-muted">
                  No hay sesiones registradas en la ventana {periodLabel}.
                </p>
              ) : (
                <WorkoutActivityHeatmap
                  sessions={scopedSessions}
                  period={period}
                  routineNames={routineNames}
                  theme="prime"
                />
              )}

              {sessionSummary.total > 0 ? (
                <p className="gp-mono mt-3 text-xs gp-text-dim">
                  Series completadas: {sessionSummary.completedSets} · Fallidas:{' '}
                  {sessionSummary.failedSets}
                </p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </PrimeScrollableModal>
  );
}
