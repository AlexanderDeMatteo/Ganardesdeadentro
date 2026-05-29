'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadFitTrackState, persistFitTrackState } from '@/lib/data/migration';
import type { FitTrackState } from '@/lib/data/types';

export type DataStoreUpdater = (prev: FitTrackState) => FitTrackState;

type DataStoreContextValue = {
  state: FitTrackState;
  isHydrated: boolean;
  setState: (updater: DataStoreUpdater) => void;
  replaceState: (next: FitTrackState) => void;
  getState: () => FitTrackState;
};

const DataStoreContext = createContext<DataStoreContextValue | null>(null);

/** Module-level reference for non-React consumers (client.ts) */
let moduleState: FitTrackState | null = null;
const subscribers = new Set<(state: FitTrackState) => void>();

function notifySubscribers(state: FitTrackState) {
  moduleState = state;
  subscribers.forEach((fn) => fn(state));
}

export function getDataState(): FitTrackState {
  if (moduleState) return moduleState;
  if (typeof window !== 'undefined') {
    moduleState = loadFitTrackState();
    return moduleState;
  }
  return loadFitTrackState();
}

export function setDataState(updater: DataStoreUpdater): FitTrackState {
  const prev = getDataState();
  const next = updater(prev);
  persistFitTrackState(next);
  notifySubscribers(next);
  return next;
}

export function subscribeDataStore(listener: (state: FitTrackState) => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setLocalState] = useState<FitTrackState>(() => loadFitTrackState());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadFitTrackState();
    moduleState = loaded;
    setLocalState(loaded);
    setIsHydrated(true);

    return subscribeDataStore((next) => {
      setLocalState(next);
    });
  }, []);

  const replaceState = useCallback((next: FitTrackState) => {
    persistFitTrackState(next);
    notifySubscribers(next);
    setLocalState(next);
  }, []);

  const setState = useCallback((updater: DataStoreUpdater) => {
    setLocalState((prev) => {
      const next = updater(prev);
      persistFitTrackState(next);
      moduleState = next;
      subscribers.forEach((fn) => fn(next));
      return next;
    });
  }, []);

  const getState = useCallback(() => state, [state]);

  const value = useMemo(
    () => ({ state, isHydrated, setState, replaceState, getState }),
    [state, isHydrated, setState, replaceState, getState],
  );

  return createElement(DataStoreContext.Provider, { value }, children);
}

export function useDataStore(): DataStoreContextValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) {
    throw new Error('useDataStore debe usarse dentro de DataProvider');
  }
  return ctx;
}
