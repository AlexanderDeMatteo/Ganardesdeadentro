'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAthleteSessionLogs } from '@/lib/data/client';
import type { SessionLog } from '@/lib/data/types';
import { useAthleteMetrics } from '@/hooks/use-athlete-metrics';

export function useAthletePerformance(athleteId: string | null | undefined) {
  const metricsState = useAthleteMetrics(athleteId);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const reloadSessions = useCallback(async () => {
    if (!athleteId) {
      setSessions([]);
      setSessionsLoading(false);
      return;
    }
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await getAthleteSessionLogs(athleteId);
      setSessions(data);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Error al cargar sesiones');
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void reloadSessions();
  }, [reloadSessions]);

  const isLoading = metricsState.isLoading || sessionsLoading;
  const error = metricsState.error ?? sessionsError;

  return {
    ...metricsState,
    sessions,
    isLoading,
    error,
    reload: async () => {
      await Promise.all([metricsState.reload(), reloadSessions()]);
    },
  };
}
