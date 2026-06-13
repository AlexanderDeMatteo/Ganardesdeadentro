'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAthleteMetrics } from '@/lib/data/client';
import type { Metric } from '@/lib/data/types';

export type AthleteLatestMetric = {
  weight: number;
  bodyFat: number;
  muscleMass: number;
  date?: string;
};

function toLatest(entries: Metric[]): AthleteLatestMetric | null {
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1];
  return {
    weight: latest.weight ?? 0,
    bodyFat: latest.bodyFat ?? 0,
    muscleMass: latest.muscleMass ?? 0,
    date: latest.date,
  };
}

export function useAthleteMetrics(athleteId: string | null | undefined) {
  const [entries, setEntries] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!athleteId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAthleteMetrics(athleteId);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar métricas');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const latest = toLatest(entries);

  const getProgressChange = useCallback(
    (field: 'weight' | 'bodyFat' | 'muscleMass') => {
      if (entries.length < 2) return null;
      const last = entries[entries.length - 1];
      const prev = entries[entries.length - 2];
      const latestValue = last[field];
      const previousValue = prev[field];
      if (typeof latestValue !== 'number' || typeof previousValue !== 'number') return null;
      return latestValue - previousValue;
    },
    [entries],
  );

  const getChartData = useCallback(
    (field: 'weight' | 'bodyFat' | 'muscleMass') =>
      entries
        .filter((entry) => typeof entry[field] === 'number')
        .map((entry) => ({
          date: new Date(entry.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          value: entry[field] as number,
          fullDate: entry.date,
        })),
    [entries],
  );

  return {
    entries,
    latest,
    isLoading,
    error,
    reload,
    getProgressChange,
    getChartData,
  };
}
