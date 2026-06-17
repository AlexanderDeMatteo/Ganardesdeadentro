'use client';

import { cn } from '@/lib/utils';

export type ExerciseCatalogTab = 'catalog' | 'custom';

type ExerciseCatalogTabsProps = {
  activeTab: ExerciseCatalogTab;
  onTabChange: (tab: ExerciseCatalogTab) => void;
  prime?: boolean;
};

export function ExerciseCatalogTabs({
  activeTab,
  onTabChange,
  prime = true,
}: ExerciseCatalogTabsProps) {
  const baseClass = prime
    ? 'gp-mono rounded-lg px-4 py-2 text-xs uppercase transition-colors'
    : 'rounded-lg px-4 py-2 text-sm transition-colors';

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones de ejercicios">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'catalog'}
        className={cn(
          baseClass,
          activeTab === 'catalog'
            ? 'gp-bg-phosphor gp-text-on-phosphor'
            : 'gp-bg-surface-high gp-text-muted hover:gp-text-primary',
        )}
        onClick={() => onTabChange('catalog')}
      >
        Catálogo
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'custom'}
        className={cn(
          baseClass,
          activeTab === 'custom'
            ? 'gp-bg-phosphor gp-text-on-phosphor'
            : 'gp-bg-surface-high gp-text-muted hover:gp-text-primary',
        )}
        onClick={() => onTabChange('custom')}
      >
        Mis ejercicios
      </button>
    </div>
  );
}
