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

export type BodyFatSource = 'manual' | 'estimated';

export interface MetricEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  /** Present when bodyFat was set explicitly (manual scale/trainer) vs app formula. */
  bodyFatSource?: BodyFatSource;
  muscleMass?: number;
  biceps?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  calves?: number;
  notes?: string;
}

const STORAGE_KEY = 'fittrack_metrics';

export type MetricsContextValue = {
  entries: MetricEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<MetricEntry, 'id'>) => MetricEntry;
  getLatestEntry: () => MetricEntry | null;
  getProgressChange: (metric: keyof MetricEntry) => number | null;
  getChartData: (metric: keyof MetricEntry) => Array<{
    date: string;
    value: number | undefined;
    fullDate: string;
    bodyFatSource?: BodyFatSource;
  }>;
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

function useMetricsStore(): MetricsContextValue {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        const mockData: MetricEntry[] = [
          {
            id: '1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            weight: 88,
            bodyFat: 22,
            muscleMass: 33,
            biceps: 31,
            chest: 98,
            waist: 82,
            hips: 95,
            thighs: 52,
            calves: 36,
          },
          {
            id: '2',
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            weight: 87,
            bodyFat: 21.5,
            muscleMass: 33.5,
            biceps: 31.5,
            chest: 99,
            waist: 81,
            hips: 94,
            thighs: 52.5,
            calves: 36.2,
          },
          {
            id: '3',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            weight: 85.5,
            bodyFat: 20.5,
            muscleMass: 34.2,
            biceps: 32,
            chest: 100,
            waist: 80,
            hips: 93,
            thighs: 53,
            calves: 36.5,
          },
          {
            id: '4',
            date: new Date().toISOString(),
            weight: 85.5,
            bodyFat: 18.5,
            muscleMass: 35.2,
            biceps: 33,
            chest: 102,
            waist: 79,
            hips: 92,
            thighs: 54,
            calves: 37,
          },
        ];
        setEntries(mockData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEntry = useCallback((entry: Omit<MetricEntry, 'id'>) => {
    const newEntry: MetricEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setEntries((prev) => {
      const updated = [...prev, newEntry];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    return newEntry;
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

      if (typeof latestValue !== 'number' || typeof previousValue !== 'number') {
        return null;
      }

      return latestValue - previousValue;
    },
    [entries],
  );

  const getChartData = useCallback(
    (metric: keyof MetricEntry) => {
      return entries
        .filter((entry) => entry[metric] !== undefined)
        .map((entry) => ({
          date: new Date(entry.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          value: entry[metric] as number | undefined,
          fullDate: entry.date,
          ...(metric === 'bodyFat' ? { bodyFatSource: entry.bodyFatSource } : {}),
        }));
    },
    [entries],
  );

  return {
    entries,
    isLoading,
    addEntry,
    getLatestEntry,
    getProgressChange,
    getChartData,
  };
}

/** Fuente única de métricas (localStorage) para toda la app. Debe envolver el árbol donde se use `useMetrics`. */
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
