'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAthleteBodyProfile } from '@/lib/data/client';
import type { BodyProfile } from '@/lib/body-profile';

export function useAthleteBodyProfile(athleteId: string | null | undefined) {
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!athleteId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAthleteBodyProfile(athleteId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil corporal');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, isLoading, error, reload };
}
