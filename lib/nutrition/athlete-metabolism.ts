import type { AthleteProfile } from '@/hooks/use-admin';
import type { MetabolismInput } from './types';

export function metabolismInputFromAthlete(athlete: AthleteProfile): MetabolismInput {
  return {
    weightKg: athlete.metrics?.weight ?? athlete.weight,
    heightCm: athlete.height,
    age: athlete.age,
    sex: athlete.gender === 'F' ? 'female' : 'male',
  };
}
