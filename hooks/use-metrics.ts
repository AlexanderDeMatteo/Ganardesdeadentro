'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/app/context/auth-context';
import {
  addMetric as clientAddMetric,
  getAthleteMetrics,
  removeMetric as clientRemoveMetric,
  updateMetric as clientUpdateMetric,
} from '@/lib/data/client';
import { useDataStore } from '@/lib/data/store';
import type { Metric } from '@/lib/data/types';
import { resolveAthleteId } from '@/lib/nutrition/resolve-athlete-id';

export type BodyFatSource = Metric['bodyFatSource'];
export type MuscleMassSource = Metric['muscleMassSource'];
export type MetricEntry = Metric;

export type MetricsContextValue = {
  entries: MetricEntry[];
  athleteId: string | null;
  isLoading: boolean;
  error: string | null;
  addEntry: (entry: Omit<MetricEntry, 'id' | 'athleteId'>) => Promise<MetricEntry>;
  updateEntry: (
    id: string,
    patch: Partial<Omit<MetricEntry, 'id' | 'athleteId'>>,
  ) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getLatestEntry: () => MetricEntry | null;
  getProgressChange: (metric: keyof MetricEntry) => number | null;
  getChartData: (metric: keyof MetricEntry | 'bicepsAvg' | 'thighAvg' | 'calfAvg') => Array<{
    date: string;
    value: number | undefined;
    fullDate: string;
    bodyFatSource?: BodyFatSource;
    muscleMassSource?: MuscleMassSource;
  }>;
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

function useMetricsStore(): MetricsContextValue {
  const { user } = useAuth();
  const { isHydrated, state } = useDataStore();
  const athleteId = resolveAthleteId(user);
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
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
    if (!isHydrated) return;
    void loadMetrics();
  }, [isHydrated, loadMetrics, state.metrics, athleteId]);

  const addEntry = useCallback(
    async (entry: Omit<MetricEntry, 'id' | 'athleteId'>) => {
      if (!athleteId) throw new Error('No hay atleta identificado');
      setError(null);
      try {
        const created = await clientAddMetric(athleteId, entry);
        setEntries((prev) => [...prev, created]);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar métrica';
        setError(message);
        throw err;
      }
    },
    [athleteId],
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Omit<MetricEntry, 'id' | 'athleteId'>>) => {
      setError(null);
      try {
        const updated = await clientUpdateMetric(id, patch);
        if (updated) {
          setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar métrica';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const removeEntry = useCallback(async (id: string) => {
    setError(null);
    try {
      await clientRemoveMetric(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar métrica';
      setError(message);
      throw err;
    }
  }, []);

  const getLatestEntry = useCallback(() => {
    if (entries.length === 0) return null;
    return entries[entries.length - 1];
  }, [entries]);

  const getProgressChange = useCallback(
    (metric: keyof MetricEntry) => {
      if (entries.length < 2) return null;
      const latest = entries[entries.length - 1];
      const previous = entries[entries.length - 2];
      const latestValue = latest[metric as keyof MetricEntry];
      const previousValue = previous[metric as keyof MetricEntry];
      if (typeof latestValue !== 'number' || typeof previousValue !== 'number') return null;
      return latestValue - previousValue;
    },
    [entries],
  );

  const getChartData = useCallback(
    (metric: keyof MetricEntry | 'bicepsAvg' | 'thighAvg' | 'calfAvg') => {
      const avg = (a?: number, b?: number): number | undefined => {
        if (typeof a === 'number' && typeof b === 'number') return (a + b) / 2;
        if (typeof a === 'number') return a;
        if (typeof b === 'number') return b;
        return undefined;
      };
      return entries
        .map((entry) => {
          const value =
            metric === 'bicepsAvg'
              ? avg(entry.bicepsLeft, entry.bicepsRight)
              : metric === 'thighAvg'
                ? avg(entry.thighLeft, entry.thighRight)
                : metric === 'calfAvg'
                  ? avg(entry.calfLeft, entry.calfRight)
                  : (entry[metric] as number | undefined);
          return { entry, value };
        })
        .filter((row) => row.value !== undefined)
        .map((entry) => ({
          date: new Date(entry.entry.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          value: entry.value,
          fullDate: entry.entry.date,
          ...(metric === 'bodyFat' ? { bodyFatSource: entry.entry.bodyFatSource } : {}),
          ...(metric === 'muscleMass' ? { muscleMassSource: entry.entry.muscleMassSource } : {}),
        }));
    },
    [entries],
  );

  return {
    entries,
    athleteId,
    isLoading,
    error,
    addEntry,
    updateEntry,
    removeEntry,
    getLatestEntry,
    getProgressChange,
    getChartData,
  };
}

export function MetricsProvider({ children }: { children: ReactNode }) {
  const value = useMetricsStore();
  return createElement(MetricsContext.Provider, { value }, children);
}

export function useMetrics(): MetricsContextValue {
  const ctx = useContext(MetricsContext);
  if (!ctx) {
    throw new Error('useMetrics debe usarse dentro de MetricsProvider');
  }
  return ctx;
}
