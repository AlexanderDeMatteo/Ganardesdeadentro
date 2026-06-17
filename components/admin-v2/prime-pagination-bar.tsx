'use client';

import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';

type PrimePaginationBarProps = {
  page: number;
  pages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

export function PrimePaginationBar({
  page,
  pages,
  rangeStart,
  rangeEnd,
  total,
  onPrev,
  onNext,
}: PrimePaginationBarProps) {
  if (total === 0) return null;

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t gp-border-outline/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="gp-mono text-center text-xs gp-text-muted sm:text-left">
        Mostrando {rangeStart}–{rangeEnd} de {total} · Página {page} / {pages}
      </p>
      <div className="flex items-center justify-center gap-2">
        <PrimeChamferButton
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="px-3 py-2 text-xs"
        >
          Anterior
        </PrimeChamferButton>
        <PrimeChamferButton
          type="button"
          disabled={page >= pages}
          onClick={onNext}
          className="px-3 py-2 text-xs"
        >
          Siguiente
        </PrimeChamferButton>
      </div>
    </div>
  );
}
