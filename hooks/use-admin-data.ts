'use client';

import { useDataStore } from '@/lib/data/store';
import { getAdminOverview } from '@/lib/data/client';
import { useCallback, useEffect, useState } from 'react';

export function useAdminData() {
  const { state, isHydrated, setState } = useDataStore();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOverview = useCallback(async () => {
    const data = await getAdminOverview();
    setOverview(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void refreshOverview();
  }, [isHydrated, refreshOverview, state]);

  return {
    athletes: state.athletes,
    trainers: state.trainers,
    exercises: state.exercises,
    routines: state.routines,
    assignments: state.assignments,
    metrics: state.metrics,
    sessionLogs: state.sessionLogs,
    overview,
    isHydrated,
    isLoading: !isHydrated || isLoading,
    setState,
    refreshOverview,
  };
}
