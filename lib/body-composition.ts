import type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
import { isProfileCompleteForBodyFatEstimate } from '@/lib/body-profile';

export type BodyFatSource = 'manual' | 'estimated';
export type MuscleMassSource = 'manual' | 'estimated';

/**
 * Body Mass Index (kg/m²).
 */
export function computeBmi(weightKg: number, heightM: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightM) || heightM <= 0 || weightKg <= 0) {
    return null;
  }
  return weightKg / (heightM * heightM);
}

const BF_MIN = 5;
const BF_MAX = 50;

/**
 * Deurenberg et al., European Journal of Clinical Nutrition (1991).
 * Population-level estimate, not a clinical measurement.
 */
export function estimateBodyFatPercentDeurenberg(bmi: number, age: number, sex: BiologicalSex): number {
  const sexMale = sex === 'male' ? 1 : 0;
  const raw = 1.2 * bmi + 0.23 * age - 10.8 * sexMale - 5.4;
  return Math.min(BF_MAX, Math.max(BF_MIN, raw));
}

export function estimateBodyFatFromWeightAndProfile(
  weightKg: number,
  profile: BodyProfile,
): number | null {
  if (!isProfileCompleteForBodyFatEstimate(profile) || profile.sex == null) return null;
  const heightM = (profile.heightCm ?? 0) / 100;
  const bmi = computeBmi(weightKg, heightM);
  if (bmi == null || profile.age == null) return null;
  return estimateBodyFatPercentDeurenberg(bmi, profile.age, profile.sex);
}

/** Lean body mass (kg) from weight and body fat %. */
export function estimateLeanBodyMassKg(weightKg: number, bodyFatPercent: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(bodyFatPercent)) return null;
  if (bodyFatPercent < 0 || bodyFatPercent > 100) return null;
  return weightKg * (1 - bodyFatPercent / 100);
}

/** Approximate skeletal muscle mass as a fraction of lean mass (orientation only, not DEXA/BIA). */
const MUSCLE_FRACTION: Record<BiologicalSex, number> = {
  male: 0.5,
  female: 0.45,
};

export function estimateMuscleMassKg(
  weightKg: number,
  bodyFatPercent: number,
  sex: BiologicalSex,
): number | null {
  const lean = estimateLeanBodyMassKg(weightKg, bodyFatPercent);
  if (lean == null) return null;
  const muscle = lean * MUSCLE_FRACTION[sex];
  return Math.round(muscle * 10) / 10;
}

export type ResolveBodyCompositionInput = {
  weightKg: number | null;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
  profile: BodyProfile;
  bodyFatSourceDraft: BodyFatSource | null;
  muscleMassSourceDraft: MuscleMassSource | null;
};

export type ResolvedBodyComposition = {
  bodyFat?: number;
  bodyFatSource?: BodyFatSource;
  muscleMass?: number;
  muscleMassSource?: MuscleMassSource;
};

function roundOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Resolves body fat and muscle mass for a metric entry.
 * Manual form values take priority; otherwise Deurenberg + lean-mass derivation apply when profile allows.
 */
export function resolveBodyComposition(input: ResolveBodyCompositionInput): ResolvedBodyComposition {
  const { weightKg, profile } = input;
  const out: ResolvedBodyComposition = {};

  let resolvedBodyFat: number | null = null;
  let resolvedBodyFatSource: BodyFatSource | undefined;

  if (input.bodyFatPercent != null && input.bodyFatSourceDraft === 'estimated') {
    resolvedBodyFat = roundOneDecimal(input.bodyFatPercent);
    resolvedBodyFatSource = 'estimated';
  } else if (input.bodyFatPercent != null && input.bodyFatSourceDraft !== 'estimated') {
    resolvedBodyFat = roundOneDecimal(input.bodyFatPercent);
    resolvedBodyFatSource = 'manual';
  } else if (weightKg != null && isProfileCompleteForBodyFatEstimate(profile)) {
    const estimated = estimateBodyFatFromWeightAndProfile(weightKg, profile);
    if (estimated != null) {
      resolvedBodyFat = roundOneDecimal(estimated);
      resolvedBodyFatSource = 'estimated';
    }
  }

  if (resolvedBodyFat != null) {
    out.bodyFat = resolvedBodyFat;
    out.bodyFatSource = resolvedBodyFatSource;
  }

  if (input.muscleMassKg != null && input.muscleMassSourceDraft === 'estimated') {
    out.muscleMass = roundOneDecimal(input.muscleMassKg);
    out.muscleMassSource = 'estimated';
    return out;
  }

  if (input.muscleMassKg != null && input.muscleMassSourceDraft !== 'estimated') {
    out.muscleMass = roundOneDecimal(input.muscleMassKg);
    out.muscleMassSource = 'manual';
    return out;
  }

  if (weightKg != null && resolvedBodyFat != null && profile.sex != null) {
    const estimatedMuscle = estimateMuscleMassKg(weightKg, resolvedBodyFat, profile.sex);
    if (estimatedMuscle != null) {
      out.muscleMass = estimatedMuscle;
      out.muscleMassSource = 'estimated';
    }
  }

  return out;
}

/** Preview composition for the form button (Deurenberg + muscle derivation). */
export function previewBodyComposition(
  weightKg: number,
  profile: BodyProfile,
): ResolvedBodyComposition | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!isProfileCompleteForBodyFatEstimate(profile) || profile.sex == null) return null;

  const bodyFat = estimateBodyFatFromWeightAndProfile(weightKg, profile);
  if (bodyFat == null) return null;

  const bf = roundOneDecimal(bodyFat);
  const muscleMass = estimateMuscleMassKg(weightKg, bf, profile.sex);
  if (muscleMass == null) return null;

  return {
    bodyFat: bf,
    bodyFatSource: 'estimated',
    muscleMass,
    muscleMassSource: 'estimated',
  };
}
