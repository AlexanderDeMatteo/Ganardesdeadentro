'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ExerciseMuscleFilter } from '@/components/exercises/exercise-muscle-filter';
import {
  listExerciseMuscles,
  listExercisesPaginated,
  searchExercises,
} from '@/lib/data/client';
import type { Exercise } from '@/lib/data/types';
import { cn } from '@/lib/utils';

export type ExercisePickerTab = 'catalog' | 'platform' | 'mine';

type ExercisePickerPanelProps = {
  selectedExerciseId: string;
  onSelectExerciseId: (id: string) => void;
  fallbackExercises?: Exercise[];
  prime?: boolean;
  labelClass?: string;
  selectClass?: string;
  inputClass?: string;
};

export function ExercisePickerPanel({
  selectedExerciseId,
  onSelectExerciseId,
  fallbackExercises = [],
  prime = false,
  labelClass = 'block text-sm font-medium mb-2',
  selectClass = 'w-full rounded-lg bg-background border border-secondary/30 px-4 py-2 text-sm',
  inputClass = 'h-10 bg-background border-secondary/30',
}: ExercisePickerPanelProps) {
  const [activeTab, setActiveTab] = useState<ExercisePickerTab>('catalog');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [search, setSearch] = useState('');
  const [loadedExercises, setLoadedExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void listExerciseMuscles({ source: 'catalog' })
      .then((list) => {
        setMuscles(list);
        setSelectedMuscle((prev) => (prev && list.includes(prev) ? prev : (list[0] ?? '')));
      })
      .catch(() => {
        setMuscles([]);
        setSelectedMuscle('');
      });
  }, []);

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const q = search.trim();
      if (q.length >= 2) {
        const results = await searchExercises(q);
        setLoadedExercises(results);
        return;
      }

      if (activeTab === 'catalog') {
        if (!selectedMuscle) {
          setLoadedExercises([]);
          return;
        }
        const result = await listExercisesPaginated({
          source: 'catalog',
          muscle: selectedMuscle,
          page: 1,
          perPage: 100,
        });
        setLoadedExercises(result.exercises);
        return;
      }

      const result = await listExercisesPaginated({
        source: 'custom',
        customScope: activeTab === 'platform' ? 'platform' : 'mine',
        muscle: selectedMuscle || undefined,
        page: 1,
        perPage: 100,
        q: q.length > 0 ? q : undefined,
      });
      setLoadedExercises(result.exercises);
    } catch (error) {
      setLoadedExercises([]);
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar ejercicios');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, selectedMuscle]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExercises();
    }, search.trim().length >= 2 ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadExercises, search]);

  const pickerExercises = useMemo(() => {
    const byId = new Map<string, Exercise>();
    for (const ex of fallbackExercises) byId.set(ex.id, ex);
    for (const ex of loadedExercises) byId.set(ex.id, ex);
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [fallbackExercises, loadedExercises]);

  const visibleExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length >= 2) {
      return pickerExercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.targetMuscle.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q),
      );
    }
    if (activeTab === 'catalog' && selectedMuscle) {
      return pickerExercises.filter((ex) => ex.targetMuscle === selectedMuscle && !ex.isCustom);
    }
    if (activeTab === 'platform') {
      return pickerExercises.filter((ex) => ex.isCustom);
    }
    if (activeTab === 'mine') {
      return pickerExercises.filter((ex) => ex.isCustom);
    }
    return pickerExercises;
  }, [activeTab, pickerExercises, search, selectedMuscle]);

  const tabClass = (tab: ExercisePickerTab) =>
    cn(
      'rounded-lg px-3 py-1.5 text-xs uppercase transition-colors',
      prime ? 'gp-mono' : 'text-sm font-medium',
      activeTab === tab
        ? prime
          ? 'gp-bg-phosphor gp-text-on-phosphor'
          : 'bg-primary text-primary-foreground'
        : prime
          ? 'gp-bg-surface-high gp-text-muted hover:gp-text-primary'
          : 'bg-secondary/10 text-muted-foreground hover:text-foreground',
    );

  const emptyHint =
    activeTab === 'catalog'
      ? muscles.length === 0
        ? 'El administrador debe sincronizar el catálogo antes de filtrar por músculo.'
        : 'Selecciona un músculo o busca por nombre (mín. 2 caracteres).'
      : activeTab === 'platform'
        ? 'No hay ejercicios creados por el administrador para este filtro.'
        : 'Aún no has creado ejercicios custom. Usa «Crear ejercicio».';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Origen de ejercicios">
        <button type="button" role="tab" aria-selected={activeTab === 'catalog'} className={tabClass('catalog')} onClick={() => setActiveTab('catalog')}>
          Catálogo
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'platform'} className={tabClass('platform')} onClick={() => setActiveTab('platform')}>
          Del admin
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'mine'} className={tabClass('mine')} onClick={() => setActiveTab('mine')}>
          Mis ejercicios
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <ExerciseMuscleFilter
          muscles={muscles}
          selectedMuscle={selectedMuscle}
          onMuscleChange={setSelectedMuscle}
          search={search}
          onSearchChange={setSearch}
          showMuscleSelect={muscles.length > 0}
          prime={prime}
        />
      ) : (
        <Input
          placeholder="Buscar por nombre (mín. 2 caracteres)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
          aria-label="Buscar ejercicios custom"
        />
      )}

      <div>
        <label className={labelClass} htmlFor="routine-exercise-select">
          Ejercicio
        </label>
        <select
          id="routine-exercise-select"
          value={selectedExerciseId}
          onChange={(e) => onSelectExerciseId(e.target.value)}
          className={selectClass}
          disabled={isLoading && visibleExercises.length === 0}
        >
          <option value="">
            {isLoading ? 'Cargando ejercicios…' : 'Selecciona un ejercicio'}
          </option>
          {visibleExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.targetMuscle})
              {ex.isCustom ? ' · custom' : ''}
            </option>
          ))}
        </select>
        {loadError ? (
          <p className={cn('mt-2 text-xs text-destructive', prime && 'gp-mono')}>{loadError}</p>
        ) : null}
        {!isLoading && visibleExercises.length === 0 && selectedExerciseId === '' ? (
          <p className={cn('mt-2 text-xs text-muted-foreground', prime && 'gp-mono gp-text-dim')}>
            {emptyHint}
          </p>
        ) : null}
        {activeTab === 'catalog' && selectedMuscle ? (
          <p className={cn('mt-1 text-xs text-muted-foreground', prime && 'gp-mono gp-text-dim')}>
            Mostrando ejercicios de {selectedMuscle}
            {visibleExercises.length > 0 ? ` (${visibleExercises.length})` : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}
