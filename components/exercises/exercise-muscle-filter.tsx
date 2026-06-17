'use client';

import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';

type ExerciseMuscleFilterProps = {
  muscles: string[];
  selectedMuscle: string;
  onMuscleChange: (muscle: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showMuscleSelect?: boolean;
};

export function ExerciseMuscleFilter({
  muscles,
  selectedMuscle,
  onMuscleChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar en catálogo (mín. 2 caracteres)...',
  showMuscleSelect = true,
}: ExerciseMuscleFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {showMuscleSelect && muscles.length > 0 ? (
        <label className="flex min-w-[10rem] flex-col gap-1">
          <span className="gp-mono text-[10px] uppercase gp-text-dim">Músculo</span>
          <select
            value={selectedMuscle}
            onChange={(e) => onMuscleChange(e.target.value)}
            className="gp-field gp-mono h-9 rounded-lg px-3 text-sm"
            aria-label="Filtrar por músculo"
          >
            {muscles.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscle}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="flex-1">
        <PrimeSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          ariaLabel="Buscar ejercicios en catálogo"
        />
      </div>
    </div>
  );
}
