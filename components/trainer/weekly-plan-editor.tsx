'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { assignWeeklyPlan } from '@/lib/data/client';
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

function defaultDays(routines: Routine[]): WeeklyPlanDay[] {
  return WEEK_DAY_LABELS.map((label, dayIndex) => ({
    dayIndex,
    label,
    routineId:
      dayIndex === 0
        ? routines[0]?.id ?? null
        : dayIndex === 2
          ? routines[0]?.id ?? null
          : dayIndex === 1 || dayIndex === 4
            ? routines[1]?.id ?? routines[0]?.id ?? null
            : null,
    focus:
      dayIndex === 0
        ? 'Tren superior'
        : dayIndex === 1
          ? 'Piernas'
          : dayIndex === 6
            ? 'Descanso'
            : undefined,
  }));
}

export function WeeklyPlanEditor({ athletes, routines, trainerId }: WeeklyPlanEditorProps) {
  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? '');
  const [days, setDays] = useState<WeeklyPlanDay[]>(() => defaultDays(routines));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDays(defaultDays(routines));
  }, [routines]);

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
      await assignWeeklyPlan(athleteId, trainerId, days, getMondayOfWeek());
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
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Atleta</label>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
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
            />
          </div>
        ))}
      </div>

      <Button onClick={() => void handleSave()} disabled={isSaving}>
        {isSaving ? 'Guardando…' : 'Publicar plan semanal'}
      </Button>
    </div>
  );
}

function InputFocus({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder="Enfoque (ej. Piernas)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
    />
  );
}
