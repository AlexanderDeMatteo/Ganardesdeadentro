'use client';

import { PrimeSearchInput } from '@/components/admin-v2/prime-search-input';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ExerciseMuscleFilterProps = {
  muscles: string[];
  selectedMuscle: string;
  onMuscleChange: (muscle: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showMuscleSelect?: boolean;
  prime?: boolean;
};

export function ExerciseMuscleFilter({
  muscles,
  selectedMuscle,
  onMuscleChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar en catálogo (mín. 2 caracteres)...',
  showMuscleSelect = true,
  prime = true,
}: ExerciseMuscleFilterProps) {
  const selectClass = prime
    ? 'gp-field gp-mono h-9 rounded-lg px-3 text-sm'
    : 'h-10 w-full rounded-lg border border-secondary/30 bg-background px-3 text-sm';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {showMuscleSelect && muscles.length > 0 ? (
        <label className={cn('flex min-w-[10rem] flex-col gap-1', !prime && 'text-sm')}>
          <span className={prime ? 'gp-mono text-[10px] uppercase gp-text-dim' : 'font-medium text-muted-foreground'}>
            Músculo
          </span>
          <select
            value={selectedMuscle}
            onChange={(e) => onMuscleChange(e.target.value)}
            className={selectClass}
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
        {prime ? (
          <PrimeSearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            ariaLabel="Buscar ejercicios en catálogo"
          />
        ) : (
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 bg-background border-secondary/30"
            aria-label="Buscar ejercicios en catálogo"
          />
        )}
      </div>
    </div>
  );
}
