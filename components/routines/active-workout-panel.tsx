'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { markSessionComplete } from '@/lib/data/client';
import {
  getSuggestedWeightForSet,
  taskUsesWeightLogging,
  totalPlannedSets,
  type RoutineTask,
  type UiRoutine,
} from '@/lib/data/routine-ui-adapter';
import { buildExerciseReviewItemsFromSetLogs } from '@/lib/coach/exercise-review';
import type { SessionReviewRequest } from '@/lib/coach/types';
import type { SessionLog, SetLogEntry } from '@/lib/data/types';
import {
  countSetResults,
  deriveSessionOutcome,
  getLastWeightForExercise,
  setLogsToResultMap,
  weightLoadIndicator,
  workoutSetResultKey,
  type SetDraft,
} from '@/lib/workout/session-utils';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Clock, Loader2, Trophy } from 'lucide-react';

interface WorkoutDraft {
  routineId: string;
  scheduledDate: string;
  currentExerciseIndex: number;
  currentSet: number;
  setLogs: SetLogEntry[];
  restSecondsLeft: number;
}

function draftKey(athleteId: string, routineId: string, scheduledDate: string): string {
  return `fittrack_workout_draft_${athleteId}_${routineId}_${scheduledDate}`;
}

function defaultWeightForSet(
  task: RoutineTask,
  setNumber: number,
  sessionLogs: SessionLog[],
): string {
  const suggested = getSuggestedWeightForSet(task, setNumber);
  if (suggested != null && suggested > 0) return String(suggested);
  const last = getLastWeightForExercise(sessionLogs, task.id);
  if (last != null && last > 0) return String(last);
  return '';
}

interface ActiveWorkoutPanelProps {
  uiRoutine: UiRoutine;
  athleteId: string;
  assignmentId?: string;
  weekPlanId?: string;
  scheduledDate: string;
  sessionLogs: SessionLog[];
  userName: string;
  isAuthenticated: boolean;
  onSessionSaved: () => void;
  onRequestReview: (payload: SessionReviewRequest) => void;
}

export function ActiveWorkoutPanel({
  uiRoutine,
  athleteId,
  assignmentId,
  weekPlanId,
  scheduledDate,
  sessionLogs,
  userName,
  isAuthenticated,
  onSessionSaved,
  onRequestReview,
}: ActiveWorkoutPanelProps) {
  const totalSets = totalPlannedSets(uiRoutine);
  const storageKey = draftKey(athleteId, uiRoutine.storeId, scheduledDate);

  const [sessionActive, setSessionActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setLogs, setSetLogs] = useState<SetLogEntry[]>([]);
  const [setDraft, setSetDraft] = useState<SetDraft>({ reps: '', weightKg: '' });
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [techniqueOpen, setTechniqueOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const savedRef = useRef(false);
  const liveRef = useRef<HTMLDivElement>(null);

  const currentTask = uiRoutine.tasks[currentExerciseIndex];
  const resultMap = useMemo(() => setLogsToResultMap(setLogs), [setLogs]);
  const { completedSets, failedSets } = countSetResults(setLogs);
  const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const suggestedWeight = currentTask
    ? getSuggestedWeightForSet(currentTask, currentSet)
    : undefined;
  const parsedWeight = setDraft.weightKg.trim()
    ? Number.parseFloat(setDraft.weightKg)
    : undefined;
  const loadIndicator = weightLoadIndicator(parsedWeight, suggestedWeight);
  const usesWeight = currentTask ? taskUsesWeightLogging(currentTask) : false;

  const restoreDraft = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return false;
      const draft = JSON.parse(raw) as WorkoutDraft;
      if (draft.routineId !== uiRoutine.storeId || draft.scheduledDate !== scheduledDate) return false;
      setCurrentExerciseIndex(draft.currentExerciseIndex);
      setCurrentSet(draft.currentSet);
      setSetLogs(draft.setLogs ?? []);
      setRestSecondsLeft(draft.restSecondsLeft ?? 0);
      setSessionActive(true);
      setSessionDone(false);
      return true;
    } catch {
      return false;
    }
  }, [storageKey, uiRoutine.storeId, scheduledDate]);

  const persistDraft = useCallback(
    (logs: SetLogEntry[], exIdx: number, setNum: number, rest: number) => {
      if (typeof window === 'undefined' || sessionDone) return;
      const draft: WorkoutDraft = {
        routineId: uiRoutine.storeId,
        scheduledDate,
        currentExerciseIndex: exIdx,
        currentSet: setNum,
        setLogs: logs,
        restSecondsLeft: rest,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    },
    [storageKey, uiRoutine.storeId, scheduledDate, sessionDone],
  );

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!sessionActive || !currentTask) return;
    setSetDraft({
      reps: currentTask.repsTarget,
      weightKg: defaultWeightForSet(currentTask, currentSet, sessionLogs),
    });
  }, [sessionActive, currentTask, currentSet, sessionLogs]);

  useEffect(() => {
    if (restSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setRestSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [restSecondsLeft]);

  useEffect(() => {
    if (!sessionActive) return;
    persistDraft(setLogs, currentExerciseIndex, currentSet, restSecondsLeft);
  }, [setLogs, currentExerciseIndex, currentSet, restSecondsLeft, sessionActive, persistDraft]);

  const advanceAfterSet = useCallback(
    (logs: SetLogEntry[], exIdx: number, setNum: number) => {
      const task = uiRoutine.tasks[exIdx];
      if (!task) return;
      if (setNum < task.setsPlanned) {
        setCurrentSet(setNum + 1);
        setRestSecondsLeft(task.restSeconds);
      } else if (exIdx < uiRoutine.tasks.length - 1) {
        const allDone = Array.from({ length: task.setsPlanned }, (_, i) => {
          const key = workoutSetResultKey(task.id, i + 1);
          return logs.find((l) => workoutSetResultKey(l.exerciseId, l.setNumber) === key)?.result ===
            'completed';
        }).every(Boolean);
        if (allDone) {
          setShowCelebration(true);
          window.setTimeout(() => setShowCelebration(false), 2000);
        }
        setCurrentExerciseIndex(exIdx + 1);
        setCurrentSet(1);
        setRestSecondsLeft(uiRoutine.tasks[exIdx + 1]?.restSeconds ?? 0);
      } else {
        setSessionActive(false);
        setSessionDone(true);
      }
    },
    [uiRoutine.tasks],
  );

  const recordSet = useCallback(
    (result: 'completed' | 'failed') => {
      if (!currentTask) return;
      const entry: SetLogEntry = {
        exerciseId: currentTask.id,
        exerciseName: currentTask.label,
        setNumber: currentSet,
        repsTarget: currentTask.repsTarget,
        repsLogged: setDraft.reps.trim() || currentTask.repsTarget,
        weightKg: parsedWeight,
        suggestedWeightKg: suggestedWeight,
        result,
      };
      const nextLogs = [
        ...setLogs.filter(
          (l) => !(l.exerciseId === currentTask.id && l.setNumber === currentSet),
        ),
        entry,
      ];
      setSetLogs(nextLogs);
      advanceAfterSet(nextLogs, currentExerciseIndex, currentSet);
    },
    [
      currentTask,
      currentSet,
      setDraft.reps,
      parsedWeight,
      suggestedWeight,
      setLogs,
      advanceAfterSet,
      currentExerciseIndex,
    ],
  );

  const saveSession = useCallback(async () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      const { completedSets: done, failedSets: failed } = countSetResults(setLogs);
      const outcome = deriveSessionOutcome(done, failed, totalSets);
      await markSessionComplete(athleteId, {
        routineId: uiRoutine.storeId,
        assignmentId,
        weekPlanId,
        scheduledDate,
        setLogs,
        completed: outcome === 'completed',
        completedSets: done,
        failedSets: failed,
        totalSets,
        sessionOutcome: outcome,
      });
      clearDraft();

      if (isAuthenticated) {
        const exercises = buildExerciseReviewItemsFromSetLogs(uiRoutine.tasks, setLogs);
        const maxFailed = Math.max(
          0,
          ...uiRoutine.tasks.map((t) =>
            setLogs.filter((l) => l.exerciseId === t.id && l.result === 'failed').length,
          ),
        );
        onRequestReview({
          userName,
          routineName: uiRoutine.name,
          completedSets: done,
          failedSets: failed,
          totalPlannedSets: totalSets,
          qualityTone:
            outcome === 'completed' ? 'success' : failed > 0 ? 'warning' : 'neutral',
          sessionOutcome: outcome,
          maxFailedInOneExercise: maxFailed,
          exercises,
        });
      }
      onSessionSaved();
    } catch (err) {
      savedRef.current = false;
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la sesión');
    } finally {
      setIsSaving(false);
    }
  }, [
    setLogs,
    totalSets,
    athleteId,
    uiRoutine,
    assignmentId,
    weekPlanId,
    scheduledDate,
    clearDraft,
    isAuthenticated,
    userName,
    onRequestReview,
    onSessionSaved,
  ]);

  useEffect(() => {
    if (sessionDone && !savedRef.current) {
      void saveSession();
    }
  }, [sessionDone, saveSession]);

  const startSession = () => {
    const restored = restoreDraft();
    if (!restored) {
      setSetLogs([]);
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setSessionDone(false);
      savedRef.current = false;
      setSessionActive(true);
    }
  };

  const loadIndicatorClass =
    loadIndicator === 'good'
      ? 'text-lime-400'
      : loadIndicator === 'warning'
        ? 'text-amber-400'
        : loadIndicator === 'danger'
          ? 'text-red-400'
          : 'text-muted-foreground';

  if (!sessionActive && !sessionDone) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <p className="text-sm text-muted-foreground">
          {uiRoutine.name} · {totalSets} series planificadas
        </p>
        <Button
          type="button"
          className="mt-4 bg-cyan-400 text-black hover:bg-cyan-300"
          onClick={startSession}
        >
          Comenzar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase text-cyan-400">Sesión en curso</p>
        <span className="text-xs text-muted-foreground">
          {completedSets}/{totalSets} series ({progressPct}%)
        </span>
      </div>
      <Progress value={progressPct} className="h-2" aria-label="Progreso de la sesión" />

      {sessionActive && currentTask && (
        <div
          className={cn(
            'rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4',
            showCelebration && 'ring-2 ring-lime-400/50',
          )}
        >
          <div ref={liveRef} aria-live="polite" className="sr-only">
            {currentTask.label}, serie {currentSet} de {currentTask.setsPlanned}
          </div>

          {showCelebration && (
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-lime-400">
              <Trophy className="size-4" aria-hidden />
              Ejercicio completado al 100%
            </p>
          )}

          <h3 className="text-lg font-bold text-foreground">
            {currentTask.label} — Serie {currentSet}/{currentTask.setsPlanned}
          </h3>
          <p className="text-sm text-muted-foreground">
            Objetivo: {currentTask.repsTarget} reps
            {suggestedWeight != null && suggestedWeight > 0 && (
              <> · Sugerido: {suggestedWeight} kg</>
            )}
          </p>

          {restSecondsLeft > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-amber-400">
              <Clock className="size-4" aria-hidden />
              Descanso: {restSecondsLeft}s
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="workout-reps" className="text-xs font-medium text-muted-foreground">
                Reps logueadas
              </label>
              <Input
                id="workout-reps"
                type="text"
                inputMode="numeric"
                value={setDraft.reps}
                onChange={(e) => setSetDraft((d) => ({ ...d, reps: e.target.value }))}
                className="mt-1"
              />
            </div>
            {usesWeight && (
              <div>
                <label htmlFor="workout-weight" className="text-xs font-medium text-muted-foreground">
                  Peso (kg)
                </label>
                <Input
                  id="workout-weight"
                  type="text"
                  inputMode="decimal"
                  value={setDraft.weightKg}
                  onChange={(e) => setSetDraft((d) => ({ ...d, weightKg: e.target.value }))}
                  className="mt-1"
                />
                {suggestedWeight != null && parsedWeight != null && !Number.isNaN(parsedWeight) && (
                  <p className={cn('mt-1 text-xs', loadIndicatorClass)}>
                    {loadIndicator === 'good' && 'Carga alineada con lo sugerido'}
                    {loadIndicator === 'warning' && 'Carga levemente distinta al sugerido'}
                    {loadIndicator === 'danger' && 'Carga muy distinta al sugerido'}
                    {loadIndicator === 'neutral' && `Sugerido: ${suggestedWeight} kg`}
                  </p>
                )}
              </div>
            )}
          </div>

          <Collapsible open={techniqueOpen} onOpenChange={setTechniqueOpen} className="mt-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium">
              Técnica del entrenador
              <ChevronDown
                className={cn('size-4 transition-transform', techniqueOpen && 'rotate-180')}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
              {currentTask.technique}
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => recordSet('completed')}
              disabled={restSecondsLeft > 0}
              className="bg-lime-400 text-black hover:bg-lime-300"
            >
              <Check className="mr-2 size-4" aria-hidden />
              Completar serie
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={restSecondsLeft > 0}
              onClick={() => recordSet('failed')}
            >
              Me rindo
            </Button>
          </div>
        </div>
      )}

      {sessionDone && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
          <p className="font-bold text-foreground">Sesión finalizada</p>
          <p className="text-sm text-muted-foreground">
            {completedSets} completadas · {failedSets} fallidas · {progressPct}% del plan
          </p>
          {isSaving && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Guardando y consultando a Titan…
            </p>
          )}
          {saveError && (
            <p className="mt-2 text-sm text-destructive">
              {saveError}
              <Button type="button" variant="link" className="ml-2 h-auto p-0" onClick={() => void saveSession()}>
                Reintentar
              </Button>
            </p>
          )}
          {!isSaving && !saveError && (
            <p className="mt-2 text-xs text-lime-400">Progreso guardado. Revisa el feedback de Titan.</p>
          )}
        </div>
      )}

      {Object.keys(resultMap).length > 0 && sessionActive && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Series registradas ({setLogs.length})</summary>
          <ul className="mt-2 space-y-1">
            {setLogs.map((l) => (
              <li key={`${l.exerciseId}-${l.setNumber}`}>
                {l.exerciseName} s{l.setNumber}: {l.repsLogged} reps
                {l.weightKg != null ? ` @ ${l.weightKg} kg` : ''} —{' '}
                {l.result === 'completed' ? 'OK' : 'Fallo'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
