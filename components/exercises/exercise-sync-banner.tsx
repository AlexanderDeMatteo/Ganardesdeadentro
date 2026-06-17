'use client';

import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { Loader2, RefreshCw } from 'lucide-react';

type ExerciseSyncBannerProps = {
  onSync: () => void | Promise<void>;
  isSyncing: boolean;
  lastSyncSummary?: string | null;
};

export function ExerciseSyncBanner({
  onSync,
  isSyncing,
  lastSyncSummary,
}: ExerciseSyncBannerProps) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="gp-display text-sm gp-text-primary">Catálogo ExerciseDB</p>
        <p className="gp-mono text-xs gp-text-muted">
          Sincroniza ejercicios con animación desde la API gratuita (oss.exercisedb.dev). Solo administradores.
        </p>
        {lastSyncSummary ? (
          <p className="gp-mono mt-1 text-xs gp-text-dim">{lastSyncSummary}</p>
        ) : null}
      </div>
      <PrimeChamferButton type="button" onClick={() => void onSync()} disabled={isSyncing}>
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {isSyncing ? 'Sincronizando...' : 'Sincronizar catálogo'}
      </PrimeChamferButton>
    </div>
  );
}
