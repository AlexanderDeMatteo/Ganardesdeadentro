'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useCoach } from '@/app/context/coach-context';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { getExerciseProgress } from '@/lib/data/client';
import { storeRoutineToUi, type UiRoutine } from '@/lib/data/routine-ui-adapter';
import { getScheduledDateForDayIndex } from '@/lib/workout/session-utils';
import { ActiveWorkoutPanel } from '@/components/routines/active-workout-panel';
import { SessionHistoryList } from '@/components/routines/session-history-list';
import { WeeklyPlanStrip } from '@/components/routines/weekly-plan-strip';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Dumbbell, Loader2 } from 'lucide-react';

function getTodayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function buildDaySubtitle(
  weeklyPlan: boolean,
  dayLabel: string | undefined,
  focus: string | undefined,
  routineName: string | undefined,
): string {
  if (!weeklyPlan) return 'Rutina asignada';
  const parts = [dayLabel ?? 'Día', focus ?? 'Entreno'];
  if (routineName) parts.push(routineName);
  return parts.join(' · ');
}

export function AssignedRoutineView() {
  const { user, isAuthenticated } = useAuth();
  const { requestSessionReview } = useCoach();
  const {
    activeRoutine,
    activeAssignment,
    weeklyPlan,
    getRoutineForDay,
    routineNamesById,
    weekSessionLogs,
    weekStartDate,
    athleteId,
    sessionLogs,
    isLoading,
    error,
    refresh,
    completedSessionsCount,
  } = useAthleteData();

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => getTodayDayIndex());

  const selectedDay = weeklyPlan?.days.find((d) => d.dayIndex === selectedDayIndex);
  const isRestDay = Boolean(weeklyPlan && selectedDay && !selectedDay.routineId);

  const sessionRoutine = useMemo(() => {
    if (weeklyPlan && selectedDay?.routineId) {
      return getRoutineForDay(selectedDay);
    }
    return activeRoutine;
  }, [weeklyPlan, selectedDay, activeRoutine, getRoutineForDay]);

  const uiRoutine: UiRoutine | null = useMemo(
    () => (sessionRoutine ? storeRoutineToUi(sessionRoutine) : null),
    [sessionRoutine],
  );

  const scheduledDate = useMemo(() => {
    if (weeklyPlan) return getScheduledDateForDayIndex(weekStartDate, selectedDayIndex);
    return new Date().toISOString().split('T')[0];
  }, [weeklyPlan, weekStartDate, selectedDayIndex]);

  const daySubtitle = buildDaySubtitle(
    Boolean(weeklyPlan),
    selectedDay?.label,
    selectedDay?.focus,
    sessionRoutine?.name,
  );

  const handleSessionSaved = useCallback(() => {
    void refresh();
  }, [refresh]);

  if (isLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-2xl border border-border bg-card/70">
        <Loader2 className="size-8 animate-spin text-cyan-400" aria-hidden />
        <span className="sr-only">Cargando rutina asignada…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void refresh()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!uiRoutine && !weeklyPlan) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-8 text-center">
        <Dumbbell className="mx-auto mb-4 size-12 text-muted-foreground" aria-hidden />
        <h2 className="text-xl font-bold text-foreground">Sin rutina asignada</h2>
        <p className="mt-2 text-muted-foreground">
          Tu entrenador aún no te asignó una rutina. Cuando lo haga, aparecerá aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WeeklyPlanStrip
        weeklyPlan={weeklyPlan}
        weekSessionLogs={weekSessionLogs}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        routineNamesById={routineNamesById}
      />

      {isRestDay ? (
        <div className="rounded-2xl border border-border bg-card/70 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Hoy es descanso</h2>
          <p className="mt-2 text-muted-foreground">
            Tu entrenador marcó este día como recuperación. Descansa bien o elige otro día con
            entreno en la barra semanal.
          </p>
        </div>
      ) : uiRoutine ? (
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {daySubtitle}
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase text-foreground">{uiRoutine.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{uiRoutine.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {uiRoutine.duration} min · {uiRoutine.exercises} ejercicios · {uiRoutine.difficulty}
              </p>
              {weeklyPlan ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Plan semanal · semana del {weeklyPlan.weekStartDate}
                </p>
              ) : (
                activeAssignment && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Asignada el {activeAssignment.assignedDate} · {completedSessionsCount} sesiones
                    completadas
                  </p>
                )
              )}
            </div>
          </div>

          {athleteId && (
            <div className="mt-6">
              <ActiveWorkoutPanel
                uiRoutine={uiRoutine}
                athleteId={athleteId}
                assignmentId={weeklyPlan ? undefined : activeAssignment?.id}
                weekPlanId={weeklyPlan?.id}
                scheduledDate={scheduledDate}
                sessionLogs={sessionLogs}
                userName={user?.first_name?.trim() || 'Atleta'}
                isAuthenticated={isAuthenticated}
                onSessionSaved={handleSessionSaved}
                onRequestReview={requestSessionReview}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay rutina configurada para este día. Pide a tu entrenador que actualice el plan
            semanal.
          </p>
        </div>
      )}

      {uiRoutine && (
        <div className="rounded-2xl border border-border bg-card/70 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-foreground">
            <Activity className="size-5 text-cyan-400" aria-hidden />
            Ejercicios del día
          </h3>
          <ul className="space-y-3">
            {uiRoutine.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-foreground">{task.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.setsPlanned} series × {task.repsTarget} reps
                    {task.suggestedWeightsKg?.some((w) => w > 0) && (
                      <> · Sugerido: {task.suggestedWeightsKg.filter((w) => w > 0).join(' / ')} kg</>
                    )}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  {task.restSeconds}s
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {athleteId && (
        <SessionHistoryList
          sessionLogs={sessionLogs}
          routineNames={routineNamesById}
          athleteId={athleteId}
          getProgress={getExerciseProgress}
        />
      )}
    </div>
  );
}
