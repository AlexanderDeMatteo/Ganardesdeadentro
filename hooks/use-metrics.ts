'use client';

import { useState, useCallback, useEffect } from 'react';

export interface MetricEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
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

export function useMetrics() {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load metrics from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        // Initialize with mock data
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

    const updated = [...entries, newEntry];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  }, [entries]);

  const getLatestEntry = useCallback(() => {
    if (entries.length === 0) return null;
    return entries[entries.length - 1];
  }, [entries]);

  const getProgressChange = useCallback((metric: keyof MetricEntry) => {
    if (entries.length < 2) return null;

    const latest = entries[entries.length - 1];
    const previous = entries[entries.length - 2];

    const latestValue = latest[metric as keyof MetricEntry];
    const previousValue = previous[metric as keyof MetricEntry];

    if (typeof latestValue !== 'number' || typeof previousValue !== 'number') {
      return null;
    }

    return latestValue - previousValue;
  }, [entries]);

  const getChartData = useCallback((metric: keyof MetricEntry) => {
    return entries
      .filter((entry) => entry[metric] !== undefined)
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        value: entry[metric],
        fullDate: entry.date,
      }));
  }, [entries]);

  return {
    entries,
    isLoading,
    addEntry,
    getLatestEntry,
    getProgressChange,
    getChartData,
  };
}
