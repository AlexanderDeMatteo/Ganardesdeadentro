'use client';

import { useEffect, useState } from 'react';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { assignWeeklyPlan, getWeeklyPlan } from '@/lib/data/client';
import { WEEK_DAY_LABELS, type WeeklyPlanDay } from '@/lib/data/types';
import { getMondayOfWeek } from '@/lib/workout/session-utils';
import type { AthleteProfile } from '@/hooks/use-admin';
import type { Routine } from '@/lib/data/types';
import { toast } from 'sonner';

interface PrimeTrainerWeeklyPlanProps {
  athletes: AthleteProfile[];
  routines: Routine[];
  trainerId: string;
  selectedAthleteId?: string;
  onSelectedAthleteChange?: (athleteId: string) => void;
  onPlanSaved?: () => void;
}

function neutralDefaultDays(): WeeklyPlanDay[] {
  return WEEK_DAY_LABELS.map((label, dayIndex) => ({
    dayIndex,
    label,
    routineId: null,
    focus: dayIndex === 6 ? 'Descanso' : undefined,
  }));
}

export function PrimeTrainerWeeklyPlan({
  athletes,
  routines,
  trainerId,
  selectedAthleteId,
  onSelectedAthleteChange,
  onPlanSaved,
}: PrimeTrainerWeeklyPlanProps) {
  const [internalAthleteId, setInternalAthleteId] = useState(athletes[0]?.id ?? '');
  const athleteId = selectedAthleteId ?? internalAthleteId;
  const setAthleteId = onSelectedAthleteChange ?? setInternalAthleteId;
  const [days, setDays] = useState<WeeklyPlanDay[]>(() => neutralDefaultDays());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [loadedPlanMeta, setLoadedPlanMeta] = useState<{ weekStartDate: string } | null>(null);

  useEffect(() => {
    if (!selectedAthleteId && !athleteId && athletes[0]?.id) {
      setAthleteId(athletes[0].id);
    }
  }, [athletes, athleteId, selectedAthleteId, setAthleteId]);

  useEffect(() => {
    if (!athleteId) return;

    let cancelled = false;
    setIsLoadingPlan(true);

    void (async () => {
      try {
        const plan = await getWeeklyPlan(athleteId);
        if (cancelled) return;

        if (plan?.days?.length) {
          setDays(plan.days);
          setLoadedPlanMeta({ weekStartDate: plan.weekStartDate });
        } else {
          setDays(neutralDefaultDays());
          setLoadedPlanMeta(null);
        }
      } catch {
        if (!cancelled) {
          toast.error('No se pudo cargar el plan semanal');
          setDays(neutralDefaultDays());
          setLoadedPlanMeta(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlan(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  const updateDay = (dayIndex: number, patch: Partial<WeeklyPlanDay>) => {
    setDays((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, ...patch } : d)),
    );
  };

  const handleSave = async () => {
    if (!athleteId || !trainerId) {
      toast.error('Selecciona un atleta');
      return;
    }
    setIsSaving(true);
    try {
      const weekStart = getMondayOfWeek();
      await assignWeeklyPlan(athleteId, trainerId, days, weekStart);
      setLoadedPlanMeta({ weekStartDate: weekStart });
      onPlanSaved?.();
      toast.success('Plan semanal asignado');
    } catch {
      toast.error('No se pudo guardar el plan');
    } finally {
      setIsSaving(false);
    }
  };

  if (athletes.length === 0) {
    return (
      <PrimeModule modId="TRN-50" title="PLAN_SEMANAL">
        <p className="gp-mono p-5 text-sm gp-text-muted">
          No tienes atletas asignados para crear un plan semanal.
        </p>
      </PrimeModule>
    );
  }

  return (
    <PrimeModule modId="TRN-50" title="PLAN_SEMANAL">
      <div className="space-y-6 p-4 sm:p-5">
        <div>
          <p className="gp-mono text-sm gp-text-muted">
            Asigna qué rutina corresponde a cada día. El atleta verá el calendario en /routines.
          </p>
          {isLoadingPlan ? (
            <p className="gp-mono mt-2 text-sm gp-text-muted">Cargando plan…</p>
          ) : loadedPlanMeta ? (
            <p className="gp-mono mt-2 text-sm gp-text-phosphor">
              Plan existente (semana del {loadedPlanMeta.weekStartDate})
            </p>
          ) : (
            <p className="gp-mono mt-2 text-sm gp-text-muted">Sin plan — creando uno nuevo</p>
          )}
        </div>

        <div>
          <label htmlFor="weekly-plan-athlete" className="gp-label mb-2 block gp-text-dim">
            Atleta
          </label>
          <select
            id="weekly-plan-athlete"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            disabled={isLoadingPlan}
            className="gp-mono w-full max-w-md rounded border gp-border-outline gp-bg-surface-variant px-3 py-2 text-sm gp-text-primary"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div
              key={day.dayIndex}
              className="rounded border gp-border-outline/40 gp-bg-surface-variant/20 p-4 space-y-2"
            >
              <p className="gp-mono font-bold gp-text-primary">{day.label}</p>
              <select
                value={day.routineId ?? ''}
                onChange={(e) =>
                  updateDay(day.dayIndex, {
                    routineId: e.target.value || null,
                    focus: e.target.value ? day.focus : 'Descanso',
                  })
                }
                disabled={isLoadingPlan}
                className="gp-mono w-full rounded border gp-border-outline gp-bg-surface px-2 py-1.5 text-sm"
              >
                <option value="">Descanso</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enfoque (ej. Piernas)"
                value={day.focus ?? ''}
                onChange={(e) => updateDay(day.dayIndex, { focus: e.target.value })}
                disabled={isLoadingPlan}
                className="gp-mono w-full rounded border gp-border-outline gp-bg-surface px-2 py-1.5 text-xs disabled:opacity-50"
              />
            </div>
          ))}
        </div>

        <PrimeChamferButton
          onClick={() => void handleSave()}
          disabled={isSaving || isLoadingPlan}
        >
          {isSaving ? 'Guardando…' : 'Publicar plan semanal'}
        </PrimeChamferButton>
      </div>
    </PrimeModule>
  );
}
