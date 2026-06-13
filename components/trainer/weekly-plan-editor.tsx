'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { assignWeeklyPlan, getWeeklyPlan } from '@/lib/data/client';
import { WEEK_DAY_LABELS, type WeeklyPlanDay } from '@/lib/data/types';
import { getMondayOfWeek } from '@/lib/workout/session-utils';
import type { AthleteProfile } from '@/hooks/use-admin';
import type { Routine } from '@/lib/data/types';
import { toast } from 'sonner';

interface WeeklyPlanEditorProps {
  athletes: AthleteProfile[];
  routines: Routine[];
  trainerId: string;
}

function neutralDefaultDays(): WeeklyPlanDay[] {
  return WEEK_DAY_LABELS.map((label, dayIndex) => ({
    dayIndex,
    label,
    routineId: null,
    focus: dayIndex === 6 ? 'Descanso' : undefined,
  }));
}

export function WeeklyPlanEditor({ athletes, routines, trainerId }: WeeklyPlanEditorProps) {
  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? '');
  const [days, setDays] = useState<WeeklyPlanDay[]>(() => neutralDefaultDays());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [loadedPlanMeta, setLoadedPlanMeta] = useState<{ weekStartDate: string } | null>(null);

  useEffect(() => {
    if (!athleteId && athletes[0]?.id) {
      setAthleteId(athletes[0].id);
    }
  }, [athletes, athleteId]);

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
      toast.success('Plan semanal asignado');
    } catch {
      toast.error('No se pudo guardar el plan');
    } finally {
      setIsSaving(false);
    }
  };

  if (athletes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <p className="text-muted-foreground">No tienes atletas asignados para crear un plan semanal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-secondary/20 bg-card/50 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Plan semanal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Asigna qué rutina corresponde a cada día. El atleta verá el calendario en /routines.
        </p>
        {isLoadingPlan ? (
          <p className="text-sm text-muted-foreground mt-2">Cargando plan…</p>
        ) : loadedPlanMeta ? (
          <p className="text-sm text-primary mt-2">
            Plan existente (semana del {loadedPlanMeta.weekStartDate})
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">Sin plan — creando uno nuevo</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Atleta</label>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          disabled={isLoadingPlan}
          className="w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
          <div key={day.dayIndex} className="rounded-xl border border-border p-4 space-y-2">
            <p className="font-bold text-foreground">{day.label}</p>
            <select
              value={day.routineId ?? ''}
              onChange={(e) =>
                updateDay(day.dayIndex, {
                  routineId: e.target.value || null,
                  focus: e.target.value ? day.focus : 'Descanso',
                })
              }
              disabled={isLoadingPlan}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">Descanso</option>
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <InputFocus
              value={day.focus ?? ''}
              onChange={(focus) => updateDay(day.dayIndex, { focus })}
              disabled={isLoadingPlan}
            />
          </div>
        ))}
      </div>

      <Button onClick={() => void handleSave()} disabled={isSaving || isLoadingPlan}>
        {isSaving ? 'Guardando…' : 'Publicar plan semanal'}
      </Button>
    </div>
  );
}

function InputFocus({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      placeholder="Enfoque (ej. Piernas)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs disabled:opacity-50"
    />
  );
}
