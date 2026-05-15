'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BODY_PROFILE_STORAGE_KEY,
  type BodyProfile,
  isProfileCompleteForBodyFatEstimate,
  parseBodyProfileJson,
} from '@/lib/body-profile';

export type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
export { BODY_PROFILE_STORAGE_KEY, isProfileCompleteForBodyFatEstimate } from '@/lib/body-profile';

export function useBodyProfile() {
  const [profile, setProfileState] = useState<BodyProfile>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      setProfileState(parseBodyProfileJson(localStorage.getItem(BODY_PROFILE_STORAGE_KEY)));
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setProfile = useCallback((next: BodyProfile) => {
    setProfileState(next);
    try {
      localStorage.setItem(BODY_PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const updateProfile = useCallback((patch: Partial<BodyProfile>) => {
    setProfileState((prev) => {
      const merged: BodyProfile = { ...prev, ...patch };
      try {
        localStorage.setItem(BODY_PROFILE_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }, []);

  const canEstimateBodyFat = useCallback(
    (weightKg: number) => {
      if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) return false;
      return isProfileCompleteForBodyFatEstimate(profile);
    },
    [profile],
  );

  return {
    profile,
    isLoaded,
    setProfile,
    updateProfile,
    canEstimateBodyFat,
  };
}
