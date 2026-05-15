export const BODY_PROFILE_STORAGE_KEY = 'fittrack_body_profile';

export type BiologicalSex = 'male' | 'female';

export interface BodyProfile {
  heightCm?: number;
  age?: number;
  sex?: BiologicalSex;
}

export function isProfileCompleteForBodyFatEstimate(profile: BodyProfile): boolean {
  const h = profile.heightCm;
  const a = profile.age;
  if (h == null || a == null || profile.sex == null) return false;
  if (h < 50 || h > 260) return false;
  if (a < 18 || a > 120) return false;
  return true;
}

export function parseBodyProfileJson(raw: string | null): BodyProfile {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const heightCm = typeof o.heightCm === 'number' ? o.heightCm : Number(o.heightCm);
    const age = typeof o.age === 'number' ? o.age : Number(o.age);
    const sex = o.sex === 'male' || o.sex === 'female' ? o.sex : undefined;
    return {
      heightCm: Number.isFinite(heightCm) && heightCm > 0 ? heightCm : undefined,
      age: Number.isFinite(age) && age > 0 ? Math.round(age) : undefined,
      sex,
    };
  } catch {
    return {};
  }
}
