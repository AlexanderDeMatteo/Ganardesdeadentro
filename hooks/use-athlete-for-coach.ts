'use client';

import { isApiAuthSource, isApiRoutinesSource, isApiUsersSource } from '@/lib/api/config';
import { getAthleteById } from '@/lib/data/client';
import { useTrainerData } from '@/hooks/use-trainer-data';
import { findAthleteById } from '@/lib/nutrition/resolve-athlete-id';
import type { Athlete } from '@/lib/data/types';
import { useEffect, useState } from 'react';

function isApiAthleteMode(): boolean {
  return isApiAuthSource() || isApiUsersSource() || isApiRoutinesSource();
}

export function useAthleteForCoach(athleteId: string) {
  const apiMode = isApiAthleteMode();
  const { myAthletes, isLoading: trainerListLoading } = useTrainerData();
  const [athlete, setAthlete] = useState<Athlete | null>(() =>
    apiMode ? null : findAthleteById(athleteId),
  );
  const [isLoading, setIsLoading] = useState(apiMode);

  useEffect(() => {
    if (!athleteId) {
      setAthlete(null);
      setIsLoading(false);
      return;
    }

    if (!apiMode) {
      setAthlete(findAthleteById(athleteId));
      setIsLoading(false);
      return;
    }

    const fromList = myAthletes.find((a) => a.id === athleteId);
    if (fromList) {
      setAthlete(fromList);
      setIsLoading(false);
      return;
    }

    if (trainerListLoading) {
      setIsLoading(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void getAthleteById(athleteId)
      .then((loaded) => {
        if (!cancelled) {
          setAthlete(loaded);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAthlete(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [athleteId, apiMode, myAthletes, trainerListLoading]);

  return { athlete, isLoading };
}
