'use client';

import { useCallback, useEffect, useState } from 'react';
import { isApiUsersSource } from '@/lib/api/config';
import { getBodyProfile, updateBodyProfile } from '@/lib/data/client';
import {
  BODY_PROFILE_STORAGE_KEY,
  type BodyProfile,
  isProfileCompleteForBodyFatEstimate,
  parseBodyProfileJson,
} from '@/lib/body-profile';

export type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
export { BODY_PROFILE_STORAGE_KEY, isProfileCompleteForBodyFatEstimate } from '@/lib/body-profile';

const BODY_PROFILE_MIGRATED_KEY = 'fittrack_body_profile_migrated_api';

function loadLegacyLocalProfile(): BodyProfile {
  if (typeof window === 'undefined') return {};
  return parseBodyProfileJson(localStorage.getItem(BODY_PROFILE_STORAGE_KEY));
}

function hasProfileData(profile: BodyProfile): boolean {
  return profile.heightCm != null || profile.age != null || profile.sex != null;
}

export function useBodyProfile() {
  const [profile, setProfileState] = useState<BodyProfile>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const apiMode = isApiUsersSource();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!apiMode) {
          if (!cancelled) {
            setProfileState(loadLegacyLocalProfile());
            setIsLoaded(true);
          }
          return;
        }

        let remote = await getBodyProfile();
        const legacy = loadLegacyLocalProfile();
        const migrated = localStorage.getItem(BODY_PROFILE_MIGRATED_KEY) === '1';

        if (!migrated && hasProfileData(legacy) && !hasProfileData(remote)) {
          remote = await updateBodyProfile(legacy);
          localStorage.setItem(BODY_PROFILE_MIGRATED_KEY, '1');
          localStorage.removeItem(BODY_PROFILE_STORAGE_KEY);
        }

        if (!cancelled) {
          setProfileState(remote);
          setIsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setProfileState(apiMode ? {} : loadLegacyLocalProfile());
          setIsLoaded(true);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiMode]);

  const setProfile = useCallback(
    async (next: BodyProfile) => {
      setProfileState(next);
      if (apiMode) {
        const saved = await updateBodyProfile(next);
        setProfileState(saved);
        return;
      }
      try {
        localStorage.setItem(BODY_PROFILE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / private mode */
      }
    },
    [apiMode],
  );

  const updateProfile = useCallback(
    async (patch: Partial<BodyProfile>) => {
      const merged: BodyProfile = { ...profile, ...patch };
      await setProfile(merged);
    },
    [profile, setProfile],
  );

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
