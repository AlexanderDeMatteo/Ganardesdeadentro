import type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
import { isProfileCompleteForBodyFatEstimate } from '@/lib/body-profile';

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
 * Linear approximation of body fat % from BMI, age, and sex in adults.
 * This is a population-level estimate, not a clinical measurement.
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
