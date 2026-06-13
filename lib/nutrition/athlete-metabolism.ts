import type { AthleteProfile } from '@/hooks/use-admin';
import type { MetabolismInput } from './types';

export function metabolismInputFromAthlete(
  athlete: AthleteProfile,
  overrides?: Partial<MetabolismInput>,
): MetabolismInput {
  const latest = athlete.latestMetric ?? athlete.metrics;
  return {
    weightKg: overrides?.weightKg ?? latest?.weight ?? athlete.weight,
    heightCm: overrides?.heightCm ?? athlete.height,
    age: overrides?.age ?? athlete.age,
    sex: overrides?.sex ?? (athlete.gender === 'F' || athlete.gender === 'female' ? 'female' : 'male'),
  };
}
