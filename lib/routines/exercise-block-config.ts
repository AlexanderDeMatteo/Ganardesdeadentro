import type {
  RomRange,
  RoutineExercise,
  RoutineExerciseBlockConfig,
  RoutineStructureType,
  SupersetFinisher,
  SupersetStep,
  SupersetSubtype,
} from '@/lib/data/types';

export const ROM_RANGE_PRESETS = [
  { from: 'P1', to: 'P2' },
  { from: 'P2', to: 'P3' },
  { from: 'P1', to: 'P3' },
] as const;

export const REPS_PULL_MIN = 5;
export const REPS_PULL_MAX = 10;
export const SUPERSET_MAX_TRANSITION_SEC = 30;

export type RepsCaptureMode = 'fixed' | 'range';

export type RomRangeDraft = {
  from: string;
  to: string;
  mode: RepsCaptureMode;
  repsFixed: number;
  repsMin: number;
  repsMax: number;
};

export type StandardExerciseDraft = {
  sets: number;
  reps: number;
  rest: number;
  technique: string;
  baseWeight: string;
  weightStep: string;
  setWeights: string[];
};

export type SeriesPullExerciseDraft = {
  romRanges: RomRangeDraft[];
  rest: number;
  technique: string;
  suggestedWeightKg: string;
};

export type SupersetStepDraft = {
  weightKg: string;
  repsTarget: string;
};

export type SupersetExerciseDraft = {
  steps: SupersetStepDraft[];
  finisherWeightKg: string;
  finisherRepsTarget: string;
  rest: number;
  technique: string;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function buildWeightArray(count: number, base: number, step: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const w = base + i * step;
    return Number.isInteger(w) ? w : Math.round(w * 10) / 10;
  });
}

export function createDefaultRomRangeDrafts(): RomRangeDraft[] {
  return ROM_RANGE_PRESETS.map(({ from, to }) => ({
    from,
    to,
    mode: 'range' as const,
    repsFixed: 8,
    repsMin: REPS_PULL_MIN,
    repsMax: REPS_PULL_MAX,
  }));
}

export function createDefaultStandardDraft(): StandardExerciseDraft {
  return {
    sets: 3,
    reps: 10,
    rest: 60,
    technique: '',
    baseWeight: '20',
    weightStep: '2.5',
    setWeights: ['20', '22.5', '25'],
  };
}

export function createDefaultSeriesPullDraft(): SeriesPullExerciseDraft {
  return {
    romRanges: createDefaultRomRangeDrafts(),
    rest: 90,
    technique: '',
    suggestedWeightKg: '',
  };
}

export function createProgressiveSupersetTemplate(): SupersetExerciseDraft {
  return {
    steps: [
      { weightKg: '5', repsTarget: '20' },
      { weightKg: '10', repsTarget: '15' },
      { weightKg: '15', repsTarget: '8' },
      { weightKg: '20', repsTarget: '6' },
      { weightKg: '25', repsTarget: '4' },
    ],
    finisherWeightKg: '5',
    finisherRepsTarget: '20',
    rest: 90,
    technique: '',
  };
}

export function createRegressiveSupersetTemplate(): SupersetExerciseDraft {
  return {
    steps: [
      { weightKg: '25', repsTarget: '5' },
      { weightKg: '20', repsTarget: '8' },
      { weightKg: '15', repsTarget: '10' },
      { weightKg: '10', repsTarget: '12' },
    ],
    finisherWeightKg: '',
    finisherRepsTarget: '',
    rest: 90,
    technique: '',
  };
}

export function createDefaultSupersetDraft(subtype: SupersetSubtype): SupersetExerciseDraft {
  return subtype === 'progressive'
    ? createProgressiveSupersetTemplate()
    : createRegressiveSupersetTemplate();
}

function parsePositiveNumber(value: string): number | null {
  const n = parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function romDraftToRange(draft: RomRangeDraft): RomRange {
  if (draft.mode === 'fixed') {
    const reps = Math.round(draft.repsFixed);
    return { from: draft.from, to: draft.to, repsMin: reps, repsMax: reps };
  }
  return {
    from: draft.from,
    to: draft.to,
    repsMin: draft.repsMin,
    repsMax: draft.repsMax,
  };
}

export function romRangeToDraft(range: RomRange): RomRangeDraft {
  const isFixed = range.repsMin === range.repsMax;
  return {
    from: range.from,
    to: range.to,
    mode: isFixed ? 'fixed' : 'range',
    repsFixed: isFixed ? range.repsMin : 8,
    repsMin: range.repsMin,
    repsMax: range.repsMax,
  };
}

export function validateStandardDraft(draft: StandardExerciseDraft): ValidationResult {
  if (draft.sets < 1 || draft.sets > 10) {
    return { ok: false, error: 'Las series deben estar entre 1 y 10.' };
  }
  if (draft.reps < 1 || draft.reps > 50) {
    return { ok: false, error: 'Las repeticiones deben estar entre 1 y 50.' };
  }
  if (draft.rest < 30 || draft.rest > 300) {
    return { ok: false, error: 'El descanso debe estar entre 30 y 300 segundos.' };
  }
  return { ok: true };
}

export function validateSeriesPullDraft(draft: SeriesPullExerciseDraft): ValidationResult {
  if (draft.romRanges.length !== 3) {
    return { ok: false, error: 'Series Pull requiere exactamente 3 rangos de movimiento.' };
  }
  for (const range of draft.romRanges) {
    const normalized = romDraftToRange(range);
    if (normalized.repsMin < REPS_PULL_MIN || normalized.repsMax > REPS_PULL_MAX) {
      return { ok: false, error: `Reps por rango deben estar entre ${REPS_PULL_MIN} y ${REPS_PULL_MAX}.` };
    }
    if (normalized.repsMin > normalized.repsMax) {
      return { ok: false, error: 'Reps mínimas no pueden superar las máximas en un rango.' };
    }
  }
  if (draft.rest < 30 || draft.rest > 300) {
    return { ok: false, error: 'El descanso debe estar entre 30 y 300 segundos.' };
  }
  const weight = draft.suggestedWeightKg.trim();
  if (weight && parsePositiveNumber(weight) === null) {
    return { ok: false, error: 'Peso sugerido inválido.' };
  }
  return { ok: true };
}

function validateSupersetSteps(steps: SupersetStepDraft[]): ValidationResult {
  if (steps.length < 2) {
    return { ok: false, error: 'La superserie necesita al menos 2 escalones.' };
  }
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (parsePositiveNumber(step.weightKg) === null) {
      return { ok: false, error: `Escalón ${i + 1}: peso inválido.` };
    }
    if (!step.repsTarget.trim()) {
      return { ok: false, error: `Escalón ${i + 1}: indica repeticiones objetivo.` };
    }
  }
  return { ok: true };
}

export function validateSupersetDraft(
  draft: SupersetExerciseDraft,
  subtype: SupersetSubtype,
): ValidationResult {
  const stepsResult = validateSupersetSteps(draft.steps);
  if (!stepsResult.ok) return stepsResult;

  if (draft.rest < 30 || draft.rest > 300) {
    return { ok: false, error: 'El descanso debe estar entre 30 y 300 segundos.' };
  }

  if (subtype === 'progressive') {
    if (parsePositiveNumber(draft.finisherWeightKg) === null) {
      return { ok: false, error: 'Remate final: indica un peso válido.' };
    }
    if (!draft.finisherRepsTarget.trim()) {
      return { ok: false, error: 'Remate final: indica repeticiones objetivo.' };
    }
  }

  return { ok: true };
}

export function buildSeriesPullBlockConfig(draft: SeriesPullExerciseDraft): RoutineExerciseBlockConfig {
  return {
    romRanges: draft.romRanges.map(romDraftToRange),
  };
}

export function buildSupersetBlockConfig(
  draft: SupersetExerciseDraft,
  subtype: SupersetSubtype,
): RoutineExerciseBlockConfig {
  const steps: SupersetStep[] = draft.steps.map((s) => ({
    weightKg: parsePositiveNumber(s.weightKg) ?? 0,
    repsTarget: s.repsTarget.trim(),
  }));

  let finisher: SupersetFinisher | undefined;
  if (subtype === 'progressive') {
    finisher = {
      weightKg: parsePositiveNumber(draft.finisherWeightKg) ?? 0,
      repsTarget: draft.finisherRepsTarget.trim(),
    };
  }

  return {
    supersetSubtype: subtype,
    steps,
    finisher,
    maxTransitionRestSec: SUPERSET_MAX_TRANSITION_SEC,
  };
}

export function parseStandardWeights(draft: StandardExerciseDraft): number[] | undefined {
  const weights = draft.setWeights
    .map((w) => parseFloat(w.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return weights.length === draft.sets ? weights : undefined;
}

export function formatRomRangeLabel(range: RomRange): string {
  if (range.repsMin === range.repsMax) {
    return `${range.from}→${range.to} (${range.repsMin} reps)`;
  }
  return `${range.from}→${range.to} (${range.repsMin}–${range.repsMax} reps)`;
}

export function formatExerciseSummary(
  exercise: RoutineExercise,
  structureType: RoutineStructureType,
): { primary: string; secondary?: string } {
  if (structureType === 'series_pull' && exercise.blockConfig?.romRanges?.length) {
    const ranges = exercise.blockConfig.romRanges.map(formatRomRangeLabel).join(' · ');
    const weight =
      exercise.suggestedWeightsKg?.[0] != null ? ` · ${exercise.suggestedWeightsKg[0]} kg` : '';
    return {
      primary: `1 serie compuesta · ${ranges}`,
      secondary: `${exercise.rest}s descanso entre series${weight}`,
    };
  }

  if (structureType === 'superset' && exercise.blockConfig?.steps?.length) {
    const subtype =
      exercise.blockConfig.supersetSubtype === 'regressive' ? 'Regresiva' : 'Progresiva';
    const steps = exercise.blockConfig.steps
      .map((s) => `${s.weightKg}kg×${s.repsTarget}`)
      .join(' → ');
    const finisher = exercise.blockConfig.finisher
      ? ` · remate ${exercise.blockConfig.finisher.weightKg}kg×${exercise.blockConfig.finisher.repsTarget}`
      : '';
    return {
      primary: `${subtype} · ${steps}${finisher}`,
      secondary: `${exercise.rest}s descanso entre series · ≤${exercise.blockConfig.maxTransitionRestSec ?? SUPERSET_MAX_TRANSITION_SEC}s entre escalones`,
    };
  }

  const weights =
    exercise.suggestedWeightsKg?.length ?
      ` · Pesos: ${exercise.suggestedWeightsKg.map((w, i) => `S${i + 1} ${w}kg`).join(' · ')}`
    : '';

  return {
    primary: `${exercise.sets} x ${exercise.reps} · ${exercise.rest}s descanso${weights}`,
    secondary: exercise.technique,
  };
}

export function standardDraftFromExercise(exercise: RoutineExercise): StandardExerciseDraft {
  const weights =
    exercise.suggestedWeightsKg?.map(String) ??
    buildWeightArray(exercise.sets, 20, 2.5).map(String);
  return {
    sets: exercise.sets,
    reps: exercise.reps,
    rest: exercise.rest,
    technique: exercise.technique ?? '',
    baseWeight: weights[0] ?? '20',
    weightStep: '2.5',
    setWeights: weights,
  };
}

export function seriesPullDraftFromExercise(exercise: RoutineExercise): SeriesPullExerciseDraft {
  const ranges = exercise.blockConfig?.romRanges?.map(romRangeToDraft) ?? createDefaultRomRangeDrafts();
  return {
    romRanges: ranges.length === 3 ? ranges : createDefaultRomRangeDrafts(),
    rest: exercise.rest,
    technique: exercise.technique ?? '',
    suggestedWeightKg:
      exercise.suggestedWeightsKg?.[0] != null ? String(exercise.suggestedWeightsKg[0]) : '',
  };
}

export function supersetDraftFromExercise(exercise: RoutineExercise): SupersetExerciseDraft {
  const steps =
    exercise.blockConfig?.steps?.map((s) => ({
      weightKg: String(s.weightKg),
      repsTarget: s.repsTarget,
    })) ?? createDefaultSupersetDraft('progressive').steps;

  return {
    steps: steps.length >= 2 ? steps : createDefaultSupersetDraft('progressive').steps,
    finisherWeightKg: exercise.blockConfig?.finisher ? String(exercise.blockConfig.finisher.weightKg) : '5',
    finisherRepsTarget: exercise.blockConfig?.finisher?.repsTarget ?? '20',
    rest: exercise.rest,
    technique: exercise.technique ?? '',
  };
}

export function parseSuggestedWeightKg(value: string): number | undefined {
  const parsed = parsePositiveNumber(value.trim());
  return parsed ?? undefined;
}
