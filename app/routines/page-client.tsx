'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Activity, CalendarDays, Check, Clock, Flame, Target } from 'lucide-react';

/** Carril horizontal de dias: solo por debajo de md, sin margenes negativos (evita overflow-x en el body). */
const weekStripScrollClass =
  'flex snap-x snap-mandatory gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-2 pt-1 [-webkit-overflow-scrolling:touch] [touch-action:pan-x] [scrollbar-width:thin] md:hidden';

const routineCardClass = 'min-w-0 rounded-2xl border border-border bg-card/70 p-4 sm:p-6';

const actionCardClass =
  'min-w-0 rounded-2xl border border-cyan-400/40 bg-card/70 p-4 sm:p-6';

type RoutineTask = {
  id: string;
  label: string;
  setsPlanned: number;
  repsTarget: string;
  restSeconds: number;
  technique: string;
};

type Routine = {
  id: number;
  routineKey: string;
  name: string;
  duration: number;
  exercises: number;
  difficulty: string;
  description: string;
  tasks: RoutineTask[];
};

type SessionStatus = 'idle' | 'active' | 'rest' | 'completed' | 'abandoned';

type DayStatus = 'sin_sesion' | 'en_progreso' | 'completado' | 'no_completado';

type IncompleteItem = {
  exerciseLabel: string;
  setNumber: number;
  reason: 'failed';
};

type DaySummary = {
  plannedSets: number;
  completedSets: number;
  failedSets: number;
  completionPct: number;
  incompleteItems: IncompleteItem[];
  dayStatus: DayStatus;
};

const routines: Routine[] = [
  {
    id: 1,
    routineKey: 'dia-piernas',
    name: 'Dia Piernas',
    duration: 60,
    exercises: 6,
    difficulty: 'Intermedio',
    description: 'Enfocado en cuadriceps, isquiotibiales y gluteos',
    tasks: [
      {
        id: 'squat',
        label: 'Sentadilla',
        setsPlanned: 4,
        repsTarget: '8',
        restSeconds: 90,
        technique: 'Rodillas alineadas con dedos, pecho alto, profundidad controlada.',
      },
      {
        id: 'rdl',
        label: 'Peso muerto rumano',
        setsPlanned: 3,
        repsTarget: '10',
        restSeconds: 90,
        technique: 'Cadera atras, barra cerca de piernas, no redondear lumbar.',
      },
      {
        id: 'leg-press',
        label: 'Prensa',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 75,
        technique: 'No bloquear rodillas al extender; rango completo sin levantar gluteos del asiento.',
      },
      {
        id: 'curl',
        label: 'Curl femoral',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 60,
        technique: 'Controla la fase negativa; evita impulso con cadera.',
      },
      {
        id: 'calf',
        label: 'Gemelos',
        setsPlanned: 4,
        repsTarget: '15',
        restSeconds: 45,
        technique: 'Pausa 1s arriba y abajo; rango completo en step o suelo.',
      },
      {
        id: 'core',
        label: 'Core',
        setsPlanned: 1,
        repsTarget: '10 min',
        restSeconds: 0,
        technique: 'Respiracion diafragmatica; prioriza control sobre velocidad.',
      },
    ],
  },
  {
    id: 2,
    routineKey: 'pecho-triceps',
    name: 'Pecho y Triceps',
    duration: 45,
    exercises: 5,
    difficulty: 'Intermedio',
    description: 'Desarrollo completo del pecho y triceps',
    tasks: [
      {
        id: 'bench',
        label: 'Press banca plano',
        setsPlanned: 4,
        repsTarget: '8',
        restSeconds: 90,
        technique: 'Escapulas fijas, codos 45°, toque controlado en pecho.',
      },
      {
        id: 'dip',
        label: 'Fondos asistidos',
        setsPlanned: 3,
        repsTarget: '10',
        restSeconds: 75,
        technique: 'Pecho abierto, codo alineado; no hiperextender hombros.',
      },
      {
        id: 'incline',
        label: 'Press inclinado con mancuernas',
        setsPlanned: 4,
        repsTarget: '10',
        restSeconds: 75,
        technique: 'Mancuernas alineadas con pecho superior; recorrido completo.',
      },
      {
        id: 'tri',
        label: 'Extension de triceps en polea',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 60,
        technique: 'Codos fijos al costado; extiende solo antebrazo.',
      },
      {
        id: 'plank',
        label: 'Plancha + respiracion',
        setsPlanned: 1,
        repsTarget: '8 min',
        restSeconds: 0,
        technique: 'Cadera neutra; aprieta gluteos y abdomen sin ahogar la respiracion.',
      },
    ],
  },
  {
    id: 3,
    routineKey: 'espalda-biceps',
    name: 'Espalda y Biceps',
    duration: 50,
    exercises: 5,
    difficulty: 'Intermedio',
    description: 'Fortalecimiento de espalda y brazos',
    tasks: [
      {
        id: 'pull',
        label: 'Dominadas o jalones',
        setsPlanned: 4,
        repsTarget: '8',
        restSeconds: 90,
        technique: 'Inicia con escapula; pecho al apoyo en polea o barra.',
      },
      {
        id: 'row',
        label: 'Remo con barra',
        setsPlanned: 4,
        repsTarget: '8',
        restSeconds: 90,
        technique: 'Torso fijo 45°; tira al ombligo sin balancear tronco.',
      },
      {
        id: 'pullover',
        label: 'Pullover',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 60,
        technique: 'Ligera flexion de codos; siente estiramiento en dorsal.',
      },
      {
        id: 'curl-db',
        label: 'Curl con mancuernas',
        setsPlanned: 3,
        repsTarget: '10',
        restSeconds: 60,
        technique: 'Codos pegados al costado; sin impulso de cadera.',
      },
      {
        id: 'hammer',
        label: 'Curl martillo',
        setsPlanned: 3,
        repsTarget: '10',
        restSeconds: 60,
        technique: 'Neutro en munecas; controla la bajada.',
      },
    ],
  },
  {
    id: 4,
    routineKey: 'hombros-cardio',
    name: 'Hombros y Cardio',
    duration: 55,
    exercises: 7,
    difficulty: 'Avanzado',
    description: 'Deltoides y trabajo cardiovascular',
    tasks: [
      {
        id: 'press-m',
        label: 'Press militar',
        setsPlanned: 4,
        repsTarget: '6',
        restSeconds: 90,
        technique: 'Gluteos y abdomen activos; barra en linea con menton.',
      },
      {
        id: 'lat',
        label: 'Elevaciones laterales',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 60,
        technique: 'Codos levemente flexionados; sube sin encoger trapecio.',
      },
      {
        id: 'rear',
        label: 'Pajaro posterior',
        setsPlanned: 3,
        repsTarget: '12',
        restSeconds: 60,
        technique: 'Empuja hacia atras con codo fijo; no hiperextender lumbar.',
      },
      {
        id: 'bike',
        label: 'Bici o eliptica',
        setsPlanned: 1,
        repsTarget: '12 min',
        restSeconds: 0,
        technique: 'Ritmo moderado; manten cadencia estable.',
      },
      {
        id: 'rope',
        label: 'Cuerda',
        setsPlanned: 6,
        repsTarget: '30s',
        restSeconds: 30,
        technique: 'Saltos bajos; amortigua con punta de pie.',
      },
      {
        id: 'face',
        label: 'Face pull',
        setsPlanned: 3,
        repsTarget: '15',
        restSeconds: 45,
        technique: 'Tira hacia frente de la cara; rota munecas al final.',
      },
      {
        id: 'walk',
        label: 'Caminata inclinada',
        setsPlanned: 1,
        repsTarget: '8 min',
        restSeconds: 0,
        technique: 'Postura erguida; zancada natural en cinta inclinada.',
      },
    ],
  },
];

const weekPlan = [
  { day: 'LUN', status: 'completed' as const, focus: 'Tren superior', routineKey: 'pecho-triceps' },
  { day: 'MAR', status: 'completed' as const, focus: 'Core y cardio', routineKey: 'hombros-cardio' },
  { day: 'MIE', status: 'today' as const, focus: 'Pecho y triceps', routineKey: 'pecho-triceps' },
  { day: 'JUE', status: 'pending' as const, focus: 'Espalda', routineKey: 'espalda-biceps' },
  { day: 'VIE', status: 'pending' as const, focus: 'Piernas', routineKey: 'dia-piernas' },
  { day: 'SAB', status: 'pending' as const, focus: 'Movilidad', routineKey: 'hombros-cardio' },
  { day: 'DOM', status: 'rest' as const, focus: 'Recuperacion', routineKey: null },
];

function resolveRoutineByKey(key: string | null | undefined): Routine | undefined {
  if (!key) return undefined;
  return routines.find((r) => r.routineKey === key);
}

function resolveTodayRoutine(): Routine {
  const today = weekPlan.find((d) => d.status === 'today');
  const fromKey = today ? resolveRoutineByKey(today.routineKey) : undefined;
  return fromKey ?? routines[0];
}

function totalPlannedSetsForRoutine(r: Routine): number {
  return r.tasks.reduce((acc, t) => acc + t.setsPlanned, 0);
}

function plannedSetsForWeekDay(day: string): number {
  const entry = weekPlan.find((w) => w.day === day);
  if (!entry?.routineKey) return 0;
  const r = resolveRoutineByKey(entry.routineKey);
  return r ? totalPlannedSetsForRoutine(r) : 0;
}

function emptyDaySummary(plannedSets: number): DaySummary {
  return {
    plannedSets,
    completedSets: 0,
    failedSets: 0,
    completionPct: 0,
    incompleteItems: [],
    dayStatus: plannedSets === 0 ? 'sin_sesion' : 'sin_sesion',
  };
}

function buildInitialDailySummary(): Record<string, DaySummary> {
  const out: Record<string, DaySummary> = {};
  for (const w of weekPlan) {
    const planned = plannedSetsForWeekDay(w.day);
    out[w.day] = emptyDaySummary(planned);
  }
  const lun = out.LUN;
  if (lun && lun.plannedSets > 0) {
    out.LUN = {
      plannedSets: lun.plannedSets,
      completedSets: lun.plannedSets,
      failedSets: 0,
      completionPct: 100,
      incompleteItems: [],
      dayStatus: 'completado',
    };
  }
  const mar = out.MAR;
  if (mar && mar.plannedSets > 0) {
    const completed = Math.max(0, Math.floor(mar.plannedSets * 0.55));
    const failed = 2;
    const incomplete: IncompleteItem[] = [
      { exerciseLabel: 'Press militar', setNumber: 3, reason: 'failed' },
      { exerciseLabel: 'Cuerda', setNumber: 4, reason: 'failed' },
    ];
    out.MAR = {
      plannedSets: mar.plannedSets,
      completedSets: completed,
      failedSets: failed,
      completionPct: Math.round((completed / mar.plannedSets) * 100),
      incompleteItems: incomplete,
      dayStatus: 'no_completado',
    };
  }
  return out;
}

function setResultKey(taskId: string, setNumber: number): string {
  return `${taskId}:${setNumber}`;
}

type SessionQualityTone = 'neutral' | 'success' | 'warning' | 'danger';

/** Maximo de series "Me rindo" dentro de un mismo ejercicio (no suma entre ejercicios). */
function maxFailedSetsInAnyExercise(
  routine: Routine,
  results: Record<string, 'completed' | 'failed'>,
): number {
  let maxF = 0;
  for (const task of routine.tasks) {
    let f = 0;
    for (let s = 1; s <= task.setsPlanned; s++) {
      if (results[setResultKey(task.id, s)] === 'failed') f++;
    }
    maxF = Math.max(maxF, f);
  }
  return maxF;
}

function getSessionQualityTone(
  routine: Routine,
  results: Record<string, 'completed' | 'failed'>,
  sessionStatus: SessionStatus,
  hasAnySetRecord: boolean,
): SessionQualityTone {
  if (sessionStatus === 'idle' && !hasAnySetRecord) return 'neutral';
  const maxInOneExercise = maxFailedSetsInAnyExercise(routine, results);
  if (maxInOneExercise >= 2) return 'danger';
  if (maxInOneExercise === 1) return 'warning';
  return 'success';
}

function sessionQualityToneClasses(tone: SessionQualityTone): string {
  switch (tone) {
    case 'neutral':
      return 'border-border bg-muted/30 text-muted-foreground';
    case 'success':
      return 'border-lime-400/50 bg-lime-400/10 text-lime-400';
    case 'warning':
      return 'border-amber-400/60 bg-amber-400/10 text-amber-400';
    case 'danger':
      return 'border-red-500/60 bg-red-500/10 text-red-500';
  }
}

function sessionQualityToneDescription(tone: SessionQualityTone): string {
  switch (tone) {
    case 'neutral':
      return 'Sesion no iniciada';
    case 'success':
      return 'Sin Me rindo problematico por ejercicio';
    case 'warning':
      return 'Algun ejercicio con un Me rindo: revisa carga o tecnica';
    case 'danger':
      return 'Algun ejercicio con varios Me rindo: ajusta plan o descanso';
  }
}

function buildOrderedSetSlots(routine: Routine): { taskId: string; setNumber: number }[] {
  const out: { taskId: string; setNumber: number }[] = [];
  for (const t of routine.tasks) {
    for (let s = 1; s <= t.setsPlanned; s++) {
      out.push({ taskId: t.id, setNumber: s });
    }
  }
  return out;
}

function firstPendingSlotIndex(
  routine: Routine,
  results: Record<string, 'completed' | 'failed'>,
): number | null {
  const slots = buildOrderedSetSlots(routine);
  for (let i = 0; i < slots.length; i++) {
    const k = setResultKey(slots[i].taskId, slots[i].setNumber);
    if (results[k] === undefined) return i;
  }
  return null;
}

type ExerciseCheckDot = 'green' | 'grey' | 'amber' | 'red';

/** Punto por ejercicio: verde si todas las series ok; gris pendiente; amarillo 1 Me rindo en ese ejercicio; rojo 2+ en ese ejercicio. */
function getExerciseCheckDot(task: RoutineTask, results: Record<string, 'completed' | 'failed'>): ExerciseCheckDot {
  let failedInExercise = 0;
  let completedInExercise = 0;
  for (let s = 1; s <= task.setsPlanned; s++) {
    const k = setResultKey(task.id, s);
    const v = results[k];
    if (v === 'failed') failedInExercise++;
    else if (v === 'completed') completedInExercise++;
  }
  if (failedInExercise >= 2) return 'red';
  if (failedInExercise === 1) return 'amber';
  if (task.setsPlanned > 0 && completedInExercise === task.setsPlanned) {
    return 'green';
  }
  return 'grey';
}

/** Demo: puntos del checklist para dias que no son la sesion activa (sin detalle por serie en memoria). */
function getExerciseCheckDotFromDaySummary(task: RoutineTask, summary: DaySummary | undefined): ExerciseCheckDot {
  if (!summary || summary.plannedSets === 0) return 'grey';
  if (summary.dayStatus === 'completado') return 'green';
  if (summary.dayStatus === 'sin_sesion') return 'grey';
  const failsHere = summary.incompleteItems.filter((i) => i.exerciseLabel === task.label).length;
  if (failsHere >= 2) return 'red';
  if (failsHere === 1) return 'amber';
  return 'grey';
}

function getChecklistExerciseDot(
  task: RoutineTask,
  checklistRoutine: Routine,
  opts: {
    activeDay: string;
    workoutDayKey: string;
    selectedRoutine: Routine;
    setResults: Record<string, 'completed' | 'failed'>;
    activeDaySummary: DaySummary | undefined;
  },
): ExerciseCheckDot {
  const { activeDay, workoutDayKey, selectedRoutine, setResults, activeDaySummary } = opts;
  const isLiveSessionDay =
    activeDay === workoutDayKey && checklistRoutine.id === selectedRoutine.id;
  if (isLiveSessionDay) return getExerciseCheckDot(task, setResults);
  return getExerciseCheckDotFromDaySummary(task, activeDaySummary);
}

function sessionQualityActivityIconClass(tone: SessionQualityTone): string {
  switch (tone) {
    case 'neutral':
      return 'text-muted-foreground';
    case 'success':
      return 'text-lime-400';
    case 'warning':
      return 'text-amber-400';
    case 'danger':
      return 'text-red-500';
  }
}

function RoutinesProposalFour() {
  const todayEntry = useMemo(() => weekPlan.find((d) => d.status === 'today'), []);
  const initialRoutine = useMemo(() => resolveTodayRoutine(), []);
  const workoutDayKey = todayEntry?.day ?? 'MIE';

  const [selectedRoutineId, setSelectedRoutineId] = useState(initialRoutine.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dailySummary, setDailySummary] = useState<Record<string, DaySummary>>(buildInitialDailySummary);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [setResults, setSetResults] = useState<Record<string, 'completed' | 'failed'>>({});
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);

  const positionRef = useRef({ ex: 0, sn: 1 });
  const setResultsRef = useRef<Record<string, 'completed' | 'failed'>>({});
  const selectedRoutineIdRef = useRef(selectedRoutineId);

  useEffect(() => {
    positionRef.current = { ex: currentExerciseIndex, sn: currentSetNumber };
  }, [currentExerciseIndex, currentSetNumber]);

  useEffect(() => {
    setResultsRef.current = setResults;
  }, [setResults]);

  useEffect(() => {
    selectedRoutineIdRef.current = selectedRoutineId;
  }, [selectedRoutineId]);

  const selectedRoutine = useMemo(
    () => routines.find((r) => r.id === selectedRoutineId) ?? initialRoutine,
    [selectedRoutineId, initialRoutine],
  );

  const activeDay = useMemo(
    () => selectedCalendarDay ?? workoutDayKey,
    [selectedCalendarDay, workoutDayKey],
  );

  const activeWeekEntry = useMemo(() => weekPlan.find((w) => w.day === activeDay), [activeDay]);

  const activeDayRoutine = useMemo(() => {
    const key = activeWeekEntry?.routineKey ?? undefined;
    return resolveRoutineByKey(key);
  }, [activeWeekEntry]);

  const activeDaySummary = dailySummary[activeDay];

  const totalPlannedSets = useMemo(() => totalPlannedSetsForRoutine(selectedRoutine), [selectedRoutine]);
  const completedSetsCount = useMemo(
    () => Object.values(setResults).filter((v) => v === 'completed').length,
    [setResults],
  );
  const failedSetsCount = useMemo(
    () => Object.values(setResults).filter((v) => v === 'failed').length,
    [setResults],
  );

  const sessionProgressPct =
    totalPlannedSets > 0 ? Math.round(((completedSetsCount + failedSetsCount) / totalPlannedSets) * 100) : 0;

  const hasAnySetRecord = completedSetsCount + failedSetsCount > 0;
  const sessionQualityTone = useMemo(
    () => getSessionQualityTone(selectedRoutine, setResults, sessionStatus, hasAnySetRecord),
    [selectedRoutine, setResults, sessionStatus, hasAnySetRecord],
  );
  const qualityDescription = sessionQualityToneDescription(sessionQualityTone);
  const orderedSetSlots = useMemo(() => buildOrderedSetSlots(selectedRoutine), [selectedRoutine]);
  const pendingSlotIndex = useMemo(
    () => firstPendingSlotIndex(selectedRoutine, setResults),
    [selectedRoutine, setResults],
  );

  const currentTask = selectedRoutine.tasks[currentExerciseIndex];
  const isSessionBusy = sessionStatus === 'active' || sessionStatus === 'rest';

  const scrollToTechnique = () => {
    document.getElementById('routine-technique-v4')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mergeDaySummary = useCallback((day: string, patch: Partial<DaySummary>) => {
    setDailySummary((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }, []);

  const finalizeSessionFromResults = useCallback(
    (routine: Routine, results: Record<string, 'completed' | 'failed'>, dayKey: string) => {
      const total = totalPlannedSetsForRoutine(routine);
      const completed = Object.values(results).filter((v) => v === 'completed').length;
      const failed = Object.values(results).filter((v) => v === 'failed').length;
      const incompleteItems: IncompleteItem[] = [];
      for (const task of routine.tasks) {
        for (let s = 1; s <= task.setsPlanned; s++) {
          const k = setResultKey(task.id, s);
          if (results[k] === 'failed') {
            incompleteItems.push({ exerciseLabel: task.label, setNumber: s, reason: 'failed' });
          }
        }
      }
      const strictDone = failed === 0 && completed === total && total > 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      mergeDaySummary(dayKey, {
        plannedSets: total,
        completedSets: completed,
        failedSets: failed,
        completionPct: pct,
        incompleteItems,
        dayStatus: strictDone ? 'completado' : 'no_completado',
      });
      setSessionStatus(strictDone ? 'completed' : 'abandoned');
    },
    [mergeDaySummary],
  );

  const advanceAfterRest = useCallback(() => {
    setSessionStatus('active');
    const routineId = selectedRoutineIdRef.current;
    const r = routines.find((x) => x.id === routineId) ?? initialRoutine;
    let { ex, sn } = positionRef.current;
    const task = r.tasks[ex];
    if (!task) return;

    if (sn < task.setsPlanned) {
      sn += 1;
      positionRef.current = { ex, sn };
      setCurrentSetNumber(sn);
      return;
    }
    if (ex < r.tasks.length - 1) {
      ex += 1;
      sn = 1;
      positionRef.current = { ex, sn };
      setCurrentExerciseIndex(ex);
      setCurrentSetNumber(1);
      return;
    }

    finalizeSessionFromResults(r, setResultsRef.current, workoutDayKey);
  }, [finalizeSessionFromResults, initialRoutine, workoutDayKey]);

  const restEndAction = useRef(advanceAfterRest);
  useEffect(() => {
    restEndAction.current = advanceAfterRest;
  }, [advanceAfterRest]);

  useEffect(() => {
    if (sessionStatus !== 'rest' || !isRestRunning || restSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setRestSecondsLeft((s) => {
        if (s <= 1) {
          setIsRestRunning(false);
          window.setTimeout(() => restEndAction.current(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sessionStatus, isRestRunning, restSecondsLeft]);

  const startWorkout = () => {
    setSetResults({});
    setResultsRef.current = {};
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    positionRef.current = { ex: 0, sn: 1 };
    setSessionStatus('active');
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    mergeDaySummary(workoutDayKey, {
      dayStatus: 'en_progreso',
      completedSets: 0,
      failedSets: 0,
      completionPct: 0,
      incompleteItems: [],
      plannedSets: totalPlannedSetsForRoutine(selectedRoutine),
    });
  };

  const beginRestAfterSet = (routine: Routine, exerciseIdx: number) => {
    const task = routine.tasks[exerciseIdx];
    const secs = task.restSeconds;
    if (secs <= 0) {
      setRestSecondsLeft(0);
      setIsRestRunning(false);
      setSessionStatus('rest');
      window.setTimeout(() => restEndAction.current(), 0);
      return;
    }
    setSessionStatus('rest');
    setRestSecondsLeft(secs);
    setIsRestRunning(true);
  };

  const recordSetAndRest = (outcome: 'completed' | 'failed') => {
    if (!currentTask || sessionStatus !== 'active') return;
    const key = setResultKey(currentTask.id, currentSetNumber);
    setSetResults((prev) => {
      const next = { ...prev, [key]: outcome };
      setResultsRef.current = next;
      return next;
    });
    setDailySummary((prev) => {
      const cur = prev[workoutDayKey] ?? emptyDaySummary(0);
      const nextCompleted = outcome === 'completed' ? cur.completedSets + 1 : cur.completedSets;
      const nextFailed = outcome === 'failed' ? cur.failedSets + 1 : cur.failedSets;
      const planned = cur.plannedSets || totalPlannedSets;
      const pct = planned > 0 ? Math.round((nextCompleted / planned) * 100) : 0;
      return {
        ...prev,
        [workoutDayKey]: {
          ...cur,
          completedSets: nextCompleted,
          failedSets: nextFailed,
          completionPct: pct,
          dayStatus: 'en_progreso',
        },
      };
    });
    beginRestAfterSet(selectedRoutine, currentExerciseIndex);
  };

  const skipRest = () => {
    if (sessionStatus !== 'rest') return;
    setIsRestRunning(false);
    setRestSecondsLeft(0);
    advanceAfterRest();
  };

  const adjustRest = (delta: number) => {
    setRestSecondsLeft((s) => Math.max(0, s + delta));
  };

  const toggleRestRunning = () => {
    if (sessionStatus !== 'rest' || restSecondsLeft <= 0) return;
    setIsRestRunning((v) => !v);
  };

  const selectRoutine = (routine: Routine) => {
    if (isSessionBusy) {
      const ok = window.confirm(
        'Tienes una sesion en curso. Cambiar de rutina reiniciara el progreso de esta sesion. ¿Continuar?',
      );
      if (!ok) return;
    }
    setSelectedRoutineId(routine.id);
    selectedRoutineIdRef.current = routine.id;
    setSheetOpen(false);
    setSessionStatus('idle');
    setSetResults({});
    setResultsRef.current = {};
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    positionRef.current = { ex: 0, sn: 1 };
    setRestSecondsLeft(0);
    setIsRestRunning(false);
  };

  const openSheetSafe = () => {
    if (isSessionBusy) {
      const ok = window.confirm(
        'Tienes una sesion en curso. Abrir el selector reiniciara la sesion si eliges otra rutina. ¿Abrir?',
      );
      if (!ok) return;
    }
    setSheetOpen(true);
  };

  const renderWeekCell = (item: (typeof weekPlan)[number], layout: 'grid' | 'strip') => {
    const summary = dailySummary[item.day];
    const pctLabel =
      item.status === 'rest' || summary.plannedSets === 0
        ? '—'
        : `${summary.completionPct}%`;
    const isSelected = selectedCalendarDay === item.day;
    const interactive = item.status !== 'rest' && summary.plannedSets > 0;

    const cellInner = (
      <>
        <div className="flex min-w-0 items-center justify-between gap-1">
          <span
            className={cn(
              'text-[10px] font-black tracking-wider',
              item.status === 'today' && 'text-cyan-400',
              item.status === 'completed' && 'text-lime-400',
              item.status === 'pending' && 'text-muted-foreground',
              item.status === 'rest' && 'text-amber-300',
            )}
          >
            {item.day}
          </span>
          {item.status === 'completed' && summary.dayStatus === 'completado' && (
            <Check className="size-3.5 shrink-0 text-lime-400" aria-hidden />
          )}
        </div>
        <p className="mt-1 line-clamp-2 break-words text-[10px] font-semibold uppercase leading-tight text-foreground">
          {item.focus}
        </p>
        <p className="mt-1 text-[10px] font-bold tabular-nums text-muted-foreground">{pctLabel}</p>
      </>
    );

    const baseClass =
      layout === 'grid'
        ? 'flex min-h-[5rem] min-w-0 flex-col rounded-lg border p-2 text-left transition-colors'
        : 'flex min-h-[5.75rem] w-[30vw] max-w-[7.25rem] min-w-[6.75rem] shrink-0 snap-start flex-col rounded-lg border p-2.5 text-left transition-colors';

    if (!interactive) {
      return (
        <div
          key={item.day}
          className={cn(
            baseClass,
            item.status === 'today' && 'border-cyan-400 ring-1 ring-cyan-400/30',
            item.status === 'completed' && 'border-lime-400/50',
            item.status === 'pending' && 'border-border',
            item.status === 'rest' && 'border-amber-300/50',
            'opacity-90',
          )}
        >
          {cellInner}
        </div>
      );
    }

    return (
      <button
        key={item.day}
        type="button"
        onClick={() => setSelectedCalendarDay((d) => (d === item.day ? null : item.day))}
        className={cn(
          baseClass,
          'cursor-pointer hover:bg-muted/40',
          item.status === 'today' && 'border-cyan-400 ring-1 ring-cyan-400/30',
          item.status === 'completed' && 'border-lime-400/50',
          item.status === 'pending' && 'border-border',
          isSelected && 'ring-2 ring-lime-400/50',
        )}
      >
        {cellInner}
      </button>
    );
  };

  const checklistActivityIconClass =
    activeDay === workoutDayKey
      ? sessionQualityActivityIconClass(sessionQualityTone)
      : 'text-muted-foreground';

  return (
    <section className="min-w-0 space-y-4 sm:space-y-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className={actionCardClass}>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Centro de accion v4</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Hoy · {todayEntry?.day ?? '—'} · Demo local (no se guarda en servidor)
          </p>
          <h2 className="mt-2 break-words text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
            {selectedRoutine.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selectedRoutine.description}</p>
          <div className="mt-5 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
            <span className="inline-flex min-h-10 items-center gap-2 sm:min-h-0">
              <Clock className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
              {selectedRoutine.duration} min
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 sm:min-h-0">
              <Target className="h-4 w-4 shrink-0 text-lime-400" aria-hidden />
              {selectedRoutine.exercises} ejercicios
            </span>
            <span className="inline-flex min-h-10 min-w-0 flex-1 items-center gap-2 sm:min-h-0 sm:flex-none">
              <Flame className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <span className="break-words">Dificultad {selectedRoutine.difficulty}</span>
            </span>
          </div>

          <div className="mt-6 min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="shrink-0">Progreso de sesion (series)</span>
              <span className="tabular-nums">
                {completedSetsCount + failedSetsCount} / {totalPlannedSets} series registradas
              </span>
            </div>
            <Progress value={sessionProgressPct} className="h-2" />
          </div>

          <div
            className={cn(
              'mt-3 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide',
              sessionQualityToneClasses(sessionQualityTone),
            )}
            role="status"
            aria-live="polite"
            aria-label={`Me rindo en total: ${failedSetsCount}. ${qualityDescription}`}
          >
            <span className="block sm:inline">
              Calidad: {qualityDescription}
            </span>
            <span className="mt-1 block tabular-nums sm:mt-0 sm:ml-2 sm:inline">
              Me rindo (total series): {failedSetsCount}
            </span>
          </div>

          {(hasAnySetRecord || sessionStatus !== 'idle') && orderedSetSlots.length > 0 && (
            <div
              className="mt-3 flex flex-wrap items-center gap-1.5"
              role="list"
              aria-label="Progreso visual por serie: verde completada, rojo Me rindo, gris pendiente"
            >
              {orderedSetSlots.map((slot, i) => {
                const k = setResultKey(slot.taskId, slot.setNumber);
                const r = setResults[k];
                const dotClass =
                  r === 'completed'
                    ? 'bg-lime-400'
                    : r === 'failed'
                      ? 'bg-red-500'
                      : 'bg-muted-foreground/35';
                const isCurrent =
                  pendingSlotIndex !== null &&
                  i === pendingSlotIndex &&
                  (sessionStatus === 'active' || sessionStatus === 'rest');
                return (
                  <span
                    key={k}
                    role="listitem"
                    title={`Serie ${slot.setNumber} · ${slot.taskId}`}
                    className={cn(
                      'inline-block size-2.5 shrink-0 rounded-full',
                      dotClass,
                      isCurrent && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-background',
                    )}
                  />
                );
              })}
            </div>
          )}

          {sessionStatus === 'completed' && (
            <p className="mt-3 text-sm font-bold text-lime-400">Rutina completada (100% de series).</p>
          )}
          {sessionStatus === 'abandoned' && (
            <p className="mt-3 text-sm font-bold text-amber-300">Rutina no completada (hubo series fallidas).</p>
          )}

          <div className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
            <Button
              type="button"
              className="min-h-11 w-full bg-cyan-400 text-black hover:bg-cyan-300 sm:min-h-10 sm:w-auto sm:min-w-[12rem] sm:flex-[1.15]"
              onClick={startWorkout}
              disabled={sessionStatus === 'active' || sessionStatus === 'rest'}
            >
              {sessionStatus === 'active' || sessionStatus === 'rest'
                ? 'Sesion en curso'
                : sessionStatus === 'completed'
                  ? 'Comenzar de nuevo'
                  : sessionStatus === 'abandoned'
                    ? 'Reintentar sesion'
                    : 'Comenzar ahora'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:min-h-10 sm:w-auto sm:flex-1 sm:min-w-[9rem]"
              onClick={scrollToTechnique}
              disabled={!currentTask || sessionStatus === 'idle'}
            >
              Ver tecnica
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:min-h-10 sm:w-auto sm:flex-1 sm:min-w-[9rem]"
              onClick={openSheetSafe}
            >
              Cambiar rutina
            </Button>
          </div>
        </div>

        <SheetContent
          side="bottom"
          className="flex max-h-[min(560px,90dvh)] flex-col gap-0 rounded-t-2xl border-x-0 border-b-0 p-0"
        >
          <SheetHeader className="border-b border-border px-4 pb-3 pt-2 text-left sm:pt-4">
            <SheetTitle>Elige una rutina</SheetTitle>
            <SheetDescription>
              Selecciona otra sesion; la sesion guiada se reinicia. Solo demo en este navegador.
            </SheetDescription>
          </SheetHeader>
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => selectRoutine(routine)}
                  className={cn(
                    'min-h-14 w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted/70 sm:min-h-0',
                    routine.id === selectedRoutineId ? 'border-cyan-400/60 bg-cyan-400/5' : 'border-border',
                  )}
                >
                  <span className="font-bold uppercase text-foreground">{routine.name}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {routine.duration} min · {routine.exercises} ej · {routine.difficulty}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {(sessionStatus === 'active' || sessionStatus === 'rest') && currentTask && (
        <div className={routineCardClass}>
          <h3 className="mb-2 text-base font-bold uppercase text-foreground sm:text-lg">Sesion guiada</h3>
          {sessionStatus === 'active' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Ejercicio {currentExerciseIndex + 1} de {selectedRoutine.tasks.length}
                </p>
                <p className="text-xl font-black uppercase text-foreground">{currentTask.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Serie {currentSetNumber} de {currentTask.setsPlanned} · Objetivo reps: {currentTask.repsTarget}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="min-h-11 flex-1 bg-lime-400 text-black hover:bg-lime-300"
                  onClick={() => recordSetAndRest('completed')}
                >
                  Serie completada
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 flex-1"
                  onClick={() => recordSetAndRest('failed')}
                >
                  Me rindo
                </Button>
              </div>
            </div>
          )}
          {sessionStatus === 'rest' && (
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase text-cyan-400">Descanso</p>
              <p className="text-4xl font-black tabular-nums text-foreground">
                {Math.floor(restSecondsLeft / 60)}:{String(restSecondsLeft % 60).padStart(2, '0')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={toggleRestRunning}>
                  {isRestRunning ? 'Pausar' : 'Iniciar'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjustRest(15)}>
                  +15s
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjustRest(-15)}>
                  -15s
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={skipRest}>
                  Omitir descanso
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div id="routine-technique-v4" className={cn('scroll-mt-28 sm:scroll-mt-24', routineCardClass)}>
        <h3 className="mb-2 text-base font-bold uppercase text-foreground sm:text-lg">Tecnica del ejercicio actual</h3>
        {currentTask && sessionStatus !== 'idle' ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{currentTask.technique}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Inicia la sesion para ver la tecnica del ejercicio activo.</p>
        )}
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2">
        <div className={routineCardClass}>
          <h3 className="mb-4 flex flex-wrap items-center gap-2 text-base font-bold uppercase leading-tight text-foreground sm:text-lg">
            <CalendarDays className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
            Semana rapida
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Toca un dia con entreno planificado para ver el registro y alinear el checklist. El porcentaje son series
            completadas vs plan del dia.
          </p>

          <div className="hidden gap-2 md:grid md:grid-cols-7">{weekPlan.map((item) => renderWeekCell(item, 'grid'))}</div>

          <div className={weekStripScrollClass}>
            {weekPlan.map((item) => renderWeekCell(item, 'strip'))}
            <div className="w-3 shrink-0" aria-hidden />
          </div>

          {activeDaySummary && (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registro · {activeDay}</p>
              <p className="mt-2 text-lg font-black text-foreground">{activeDaySummary.completionPct}% completado</p>
              <p className="text-xs text-muted-foreground">
                Series: {activeDaySummary.completedSets} ok / {activeDaySummary.failedSets} fallidas · Plan{' '}
                {activeDaySummary.plannedSets}
              </p>
              <p className="mt-2 text-xs font-bold uppercase text-foreground">
                Estado:{' '}
                {activeDaySummary.dayStatus === 'sin_sesion' && 'Sin sesion'}
                {activeDaySummary.dayStatus === 'en_progreso' && 'En progreso'}
                {activeDaySummary.dayStatus === 'completado' && 'Completado'}
                {activeDaySummary.dayStatus === 'no_completado' && 'No completado'}
              </p>
              {activeDaySummary.incompleteItems.length > 0 ? (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {activeDaySummary.incompleteItems.map((it, i) => (
                    <li key={`${it.exerciseLabel}-${it.setNumber}-${i}`}>
                      {it.exerciseLabel} · serie {it.setNumber} ({it.reason})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {activeDaySummary.dayStatus === 'completado'
                    ? 'Sin pendientes: todas las series completadas.'
                    : 'No hay series fallidas registradas para este dia.'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={routineCardClass}>
          <h3 className="mb-4 flex flex-wrap items-center gap-2 text-base font-bold uppercase leading-tight text-foreground sm:text-lg">
            <Activity className={cn('h-5 w-5 shrink-0', checklistActivityIconClass)} aria-hidden />
            Checklist · {activeDay}
            {activeDay === workoutDayKey && (
              <span className="text-[10px] font-bold normal-case tracking-normal text-cyan-400">(hoy)</span>
            )}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Demo local: los puntos reflejan la sesion solo cuando el plan del dia coincide con la rutina activa. En
            otros dias se usa el resumen mock del registro. Verde: ejercicio completado · Gris: pendiente · Amarillo: un
            Me rindo en ese ejercicio · Rojo: varios Me rindo en ese ejercicio.
          </p>
          {!activeDayRoutine ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Dia de recuperacion: sin checklist programado para este dia.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm sm:space-y-3">
              {activeDayRoutine.tasks.map((task) => {
                const dot = getChecklistExerciseDot(task, activeDayRoutine, {
                  activeDay,
                  workoutDayKey,
                  selectedRoutine,
                  setResults,
                  activeDaySummary,
                });
                const line = `${task.label} - ${task.setsPlanned}x${task.repsTarget}`;
                const dotClass =
                  dot === 'green'
                    ? 'bg-lime-400'
                    : dot === 'amber'
                      ? 'bg-amber-400'
                      : dot === 'red'
                        ? 'bg-red-500'
                        : 'bg-muted-foreground/40';
                const textClass = dot === 'grey' ? 'text-muted-foreground' : 'text-foreground';
                return (
                  <li
                    key={task.id}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2.5 sm:min-h-0 sm:py-2"
                  >
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} aria-hidden />
                    <span className={cn('min-w-0 leading-snug', textClass)}>{line}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function RoutinesContent() {
  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen overflow-x-hidden">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-10 sm:pb-12 lg:px-8">
          <div className="mb-6 min-w-0 space-y-2 sm:mb-8">
            <p className="brand-kicker">Plan de combate</p>
            <h1 className="brand-title break-words text-3xl font-black sm:text-5xl md:text-6xl">Mis Rutinas</h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sesion guiada por series y descanso, calendario con porcentaje diario y registro al tocar cada dia.
            </p>
          </div>

          <div className="flex w-full min-w-0 max-w-full flex-col gap-4 sm:gap-6">
            <RoutinesProposalFour />
          </div>
        </div>
      </main>
    </>
  );
}

export default function RoutinesPage() {
  return (
    <ProtectedRoute>
      <RoutinesContent />
    </ProtectedRoute>
  );
}
