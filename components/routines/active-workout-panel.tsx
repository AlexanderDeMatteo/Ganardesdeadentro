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
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import { getExerciseById, markSessionComplete, uploadSessionExecutionVideo } from '@/lib/data/client';
import {
  getSuggestedWeightForSet,
  isCompoundSetTask,
  taskUsesWeightLogging,
  totalPlannedSets,
  type RoutineTask,
  type UiRoutine,
} from '@/lib/data/routine-ui-adapter';
import { buildExerciseReviewItemsFromSetLogs } from '@/lib/coach/exercise-review';
import type { SessionReviewRequest } from '@/lib/coach/types';
import type { Exercise, SessionLog, SetLogEntry } from '@/lib/data/types';
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
  const [animationOpen, setAnimationOpen] = useState(true);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
  const [exerciseDetailLoading, setExerciseDetailLoading] = useState(false);
  const exerciseCacheRef = useRef<Map<string, Exercise | null>>(new Map());
  const [showCelebration, setShowCelebration] = useState(false);
  const [setValidationError, setSetValidationError] = useState<string | null>(null);
  const [yieldMode, setYieldMode] = useState(false);
  const [compoundPhase, setCompoundPhase] = useState(0);
  const [pendingVideo, setPendingVideo] = useState<{ exerciseId: string; setNumber: number } | null>(
    null,
  );
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const savedRef = useRef(false);
  const repsEditedRef = useRef(false);
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
  const isCompound = Boolean(
    currentTask && isCompoundSetTask(currentTask, uiRoutine.structureType),
  );
  const compoundSteps = useMemo(() => {
    if (!currentTask) return [];
    if (uiRoutine.structureType === 'series_pull') {
      return currentTask.blockConfig?.romRanges ?? [];
    }
    if (uiRoutine.structureType === 'superset') {
      const steps = currentTask.blockConfig?.steps ?? [];
      const finisher = currentTask.blockConfig?.finisher;
      return finisher ? [...steps, finisher] : steps;
    }
    return [];
  }, [currentTask, uiRoutine.structureType]);

  useEffect(() => {
    setCompoundPhase(0);
  }, [currentExerciseIndex, currentSet]);

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
    repsEditedRef.current = false;
    setYieldMode(false);
    setSetValidationError(null);
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

  const validateFailedSet = useCallback((): string | null => {
    if (!currentTask) return 'No hay ejercicio activo';
    const repsRaw = setDraft.reps.trim();
    if (!repsRaw) {
      return 'Indica cuántas repeticiones lograste antes de rendirte';
    }
    const repsNum = Number.parseInt(repsRaw, 10);
    if (!Number.isFinite(repsNum) || repsNum < 0) {
      return 'Las repeticiones deben ser un número válido (0 o más)';
    }
    if (!repsEditedRef.current && repsRaw === currentTask.repsTarget) {
      return 'Ajusta las repeticiones logradas: no puede ser solo el objetivo sin confirmar';
    }
    if (usesWeight) {
      if (parsedWeight == null || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
        return 'Indica el peso (kg) que usaste en esta serie';
      }
    }
    return null;
  }, [currentTask, setDraft.reps, parsedWeight, usesWeight]);

  const recordSet = useCallback(
    (result: 'completed' | 'failed') => {
      if (!currentTask) return;
      if (result === 'failed') {
        const validationError = validateFailedSet();
        if (validationError) {
          setSetValidationError(validationError);
          setYieldMode(true);
          return;
        }
      }
      setSetValidationError(null);
      setYieldMode(false);
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
      setPendingVideo({ exerciseId: currentTask.id, setNumber: currentSet });
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
      validateFailedSet,
    ],
  );

  const handleYieldClick = () => {
    setYieldMode(true);
    recordSet('failed');
  };

  const handleVideoUpload = async (file: File) => {
    if (!pendingVideo) return;
    setIsUploadingVideo(true);
    try {
      const uploaded = await uploadSessionExecutionVideo(athleteId, file);
      setSetLogs((prev) =>
        prev.map((log) =>
          log.exerciseId === pendingVideo.exerciseId && log.setNumber === pendingVideo.setNumber
            ? {
                ...log,
                executionVideoUrl: uploaded.url,
                executionVideoUploadedAt: uploaded.uploadedAt ?? new Date().toISOString(),
              }
            : log,
        ),
      );
      setPendingVideo(null);
    } catch {
      setSetValidationError('No se pudo subir el video de ejecución');
    } finally {
      setIsUploadingVideo(false);
    }
  };

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

  useEffect(() => {
    if (!currentTask) {
      setExerciseDetail(null);
      return;
    }
    const cached = exerciseCacheRef.current.get(currentTask.id);
    if (cached !== undefined) {
      setExerciseDetail(cached);
      return;
    }
    let cancelled = false;
    setExerciseDetailLoading(true);
    void getExerciseById(currentTask.id)
      .then((detail) => {
        if (cancelled) return;
        exerciseCacheRef.current.set(currentTask.id, detail);
        setExerciseDetail(detail);
      })
      .finally(() => {
        if (!cancelled) setExerciseDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentTask]);

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
      <div className="rounded-xl border gp-border-outline gp-bg-surface-variant p-4">
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
        <p className="text-xs font-bold uppercase gp-text-phosphor">Sesión en curso</p>
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

          <Collapsible open={animationOpen} onOpenChange={setAnimationOpen} className="mt-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border gp-border-outline px-3 py-2 text-sm font-medium">
              Animación del ejercicio
              <ChevronDown
                className={cn('size-4 transition-transform', animationOpen && 'rotate-180')}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {exerciseDetailLoading ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed gp-border-outline">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                </div>
              ) : (
                <ExerciseAnimationPlayer
                  name={currentTask.label}
                  animationUrl={exerciseDetail?.animationUrl}
                  animationType={exerciseDetail?.animationType}
                />
              )}
            </CollapsibleContent>
          </Collapsible>

          {restSecondsLeft > 0 && (
            <div
              className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3"
              aria-live="polite"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
                <Clock className="size-4 shrink-0" aria-hidden />
                Descanso: {restSecondsLeft}s
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                  onClick={() => setRestSecondsLeft((s) => s + 15)}
                >
                  +15s
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                  onClick={() => setRestSecondsLeft(0)}
                >
                  Saltar descanso
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="workout-reps" className="text-xs font-medium text-muted-foreground">
                {yieldMode ? 'Reps logradas' : 'Reps logueadas'}
              </label>
              <Input
                id="workout-reps"
                type="text"
                inputMode="numeric"
                value={setDraft.reps}
                onChange={(e) => {
                  repsEditedRef.current = true;
                  setSetValidationError(null);
                  setSetDraft((d) => ({ ...d, reps: e.target.value }));
                }}
                className="mt-1"
              />
              {yieldMode && (
                <p className="mt-1 text-xs text-amber-400">
                  Indica lo que alcanzaste antes de rendirte
                </p>
              )}
            </div>
            {usesWeight && (
              <div>
                <label htmlFor="workout-weight" className="text-xs font-medium text-muted-foreground">
                  {yieldMode ? 'Peso usado (kg)' : 'Peso (kg)'}
                </label>
                <Input
                  id="workout-weight"
                  type="text"
                  inputMode="decimal"
                  value={setDraft.weightKg}
                  onChange={(e) => {
                    setSetValidationError(null);
                    setSetDraft((d) => ({ ...d, weightKg: e.target.value }));
                  }}
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
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border gp-border-outline px-3 py-2 text-sm font-medium">
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

          {isCompound && compoundSteps.length > 0 ? (
            <div className="mt-4 rounded-lg border gp-border-outline bg-muted/20 p-3 text-sm">
              <p className="font-medium text-foreground">
                {uiRoutine.structureType === 'series_pull' ? 'Rango de movimiento' : 'Escalón'}{' '}
                {compoundPhase + 1} de {compoundSteps.length}
              </p>
              <p className="mt-1 text-muted-foreground">
                {uiRoutine.structureType === 'series_pull'
                  ? `${(compoundSteps[compoundPhase] as { from: string; to: string }).from} → ${(compoundSteps[compoundPhase] as { from: string; to: string }).to}`
                  : `${(compoundSteps[compoundPhase] as { weightKg: number; repsTarget: string }).weightKg} kg · ${(compoundSteps[compoundPhase] as { weightKg: number; repsTarget: string }).repsTarget} reps`}
              </p>
              {compoundPhase < compoundSteps.length - 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setCompoundPhase((phase) => phase + 1)}
                >
                  Siguiente paso (≤30s)
                </Button>
              ) : null}
            </div>
          ) : null}

          {setValidationError && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {setValidationError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => recordSet('completed')}
              disabled={
                restSecondsLeft > 0 ||
                (isCompound && compoundPhase < compoundSteps.length - 1)
              }
              className="bg-lime-400 text-black hover:bg-lime-300"
            >
              <Check className="mr-2 size-4" aria-hidden />
              Completar serie
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={restSecondsLeft > 0}
              onClick={handleYieldClick}
            >
              Me rindo
            </Button>
          </div>

          {pendingVideo &&
          setLogs.some(
            (log) =>
              log.exerciseId === pendingVideo.exerciseId &&
              log.setNumber === pendingVideo.setNumber &&
              !log.executionVideoUrl,
          ) ? (
            <div className="mt-4 rounded-lg border border-dashed gp-border-outline p-3">
              <p className="text-sm font-medium">Subir video de ejecución (opcional)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Serie {pendingVideo.setNumber} registrada. Adjunta un clip para que tu entrenador revise la técnica.
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  disabled={isUploadingVideo}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleVideoUpload(file);
                    event.currentTarget.value = '';
                  }}
                />
                {isUploadingVideo ? 'Subiendo video…' : 'Elegir video'}
              </label>
            </div>
          ) : null}
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
                {l.executionVideoUrl ? ' · video ✓' : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
