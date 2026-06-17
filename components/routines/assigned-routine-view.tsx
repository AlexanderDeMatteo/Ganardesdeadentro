'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useCoach } from '@/app/context/coach-context';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { getExerciseProgress } from '@/lib/data/client';
import { storeRoutineToUi, type UiRoutine } from '@/lib/data/routine-ui-adapter';
import { getScheduledDateForDayIndex } from '@/lib/workout/session-utils';
import { ActiveWorkoutPanel } from '@/components/routines/active-workout-panel';
import { SessionHistoryList } from '@/components/routines/session-history-list';
import { WeeklyPlanStrip } from '@/components/routines/weekly-plan-strip';
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
      <div className="gp-module gp-module-corner flex min-h-[16rem] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin gp-text-phosphor" aria-hidden />
        <span className="sr-only">Cargando rutina asignada…</span>
      </div>
    );
  }

  if (error) {
    return (
      <PrimeModule modId="R00" title="ERROR" variant="critical">
        <div className="space-y-4 p-4 text-center">
          <p className="text-[var(--gp-error)]">{error}</p>
          <PrimeChamferButton type="button" onClick={() => void refresh()}>
            Reintentar
          </PrimeChamferButton>
        </div>
      </PrimeModule>
    );
  }

  if (!uiRoutine && !weeklyPlan) {
    return (
      <PrimeModule modId="R00" title="SIN_RUTINA">
        <div className="p-8 text-center">
          <Dumbbell className="mx-auto mb-4 size-12 gp-text-muted" aria-hidden />
          <h2 className="gp-display text-xl gp-text-primary">Sin rutina asignada</h2>
          <p className="mt-2 gp-text-muted">
            Tu entrenador aún no te asignó una rutina. Cuando lo haga, aparecerá aquí automáticamente.
          </p>
        </div>
      </PrimeModule>
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
        <PrimeModule modId="R01" title="DIA_DESCANSO">
          <div className="p-8 text-center">
            <h2 className="gp-display text-xl gp-text-primary">Hoy es descanso</h2>
            <p className="mt-2 gp-text-muted">
              Tu entrenador marcó este día como recuperación. Descansa bien o elige otro día con
              entreno en la barra semanal.
            </p>
          </div>
        </PrimeModule>
      ) : uiRoutine ? (
        <PrimeModule modId="R02" title="ENTRENO_DEL_DIA">
          <div className="space-y-6 p-4 sm:p-6">
            <div>
              <p className="gp-label gp-text-phosphor">{daySubtitle}</p>
              <h2 className="gp-display mt-1 text-2xl gp-text-primary">{uiRoutine.name}</h2>
              <p className="mt-2 text-sm gp-text-muted">{uiRoutine.description}</p>
              <p className="mt-2 text-xs gp-text-muted">
                {uiRoutine.duration} min · {uiRoutine.exercises} ejercicios · {uiRoutine.difficulty}
              </p>
              {weeklyPlan ? (
                <p className="mt-1 text-xs gp-text-dim">
                  Plan semanal · semana del {weeklyPlan.weekStartDate}
                </p>
              ) : (
                activeAssignment && (
                  <p className="mt-1 text-xs gp-text-dim">
                    Asignada el {activeAssignment.assignedDate} · {completedSessionsCount} sesiones
                    completadas
                  </p>
                )
              )}
            </div>

            {athleteId && (
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
            )}
          </div>
        </PrimeModule>
      ) : (
        <PrimeModule modId="R01" title="SIN_RUTINA_DIA">
          <p className="p-6 text-center text-sm gp-text-muted">
            No hay rutina configurada para este día. Pide a tu entrenador que actualice el plan
            semanal.
          </p>
        </PrimeModule>
      )}

      {uiRoutine && (
        <PrimeModule modId="R03" title="EJERCICIOS_DEL_DIA">
          <ul className="space-y-3 p-4">
            {uiRoutine.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg border gp-border-outline gp-bg-surface-variant px-4 py-3"
              >
                <div>
                  <p className="font-semibold gp-text-primary">{task.label}</p>
                  <p className="text-xs gp-text-muted">
                    {task.setsPlanned} series × {task.repsTarget} reps
                    {task.suggestedWeightsKg?.some((w) => w > 0) && (
                      <> · Sugerido: {task.suggestedWeightsKg.filter((w) => w > 0).join(' / ')} kg</>
                    )}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs gp-text-muted">
                  <Clock className="size-3.5" aria-hidden />
                  {task.restSeconds}s
                </span>
              </li>
            ))}
          </ul>
        </PrimeModule>
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
