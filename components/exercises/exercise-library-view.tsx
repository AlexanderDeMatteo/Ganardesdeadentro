'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeExerciseCatalogGrid } from '@/components/admin-v2/prime-exercise-catalog-grid';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import {
  ExerciseCatalogTabs,
  type ExerciseCatalogTab,
} from '@/components/exercises/exercise-catalog-tabs';
import { ExerciseFormModal } from '@/components/exercises/exercise-form-modal';
import { ExerciseMuscleFilter } from '@/components/exercises/exercise-muscle-filter';
import { ExerciseSyncBanner } from '@/components/exercises/exercise-sync-banner';
import { ExerciseUploadPreviewModal } from '@/components/exercises/exercise-upload-preview-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  deleteExercise,
  listExerciseMuscles,
  listExercisesPaginated,
  matchExerciseAnimation,
  searchExercises,
  syncExerciseCatalog,
  uploadExerciseMedia,
} from '@/lib/data/client';
import type { Exercise } from '@/lib/data/types';
import { canManageExercise } from '@/lib/exercises/exercise-permissions';
import { Dumbbell, Film, Plus, Sparkles } from 'lucide-react';

type ExercisesPagination = {
  page: number;
  perPage: number;
  total: number;
  pages: number;
};

type ExerciseLibraryViewProps = {
  mode: 'admin' | 'trainer';
  userId?: string | number | null;
  exercisesError?: string | null;
  onRefreshLegacy?: () => void | Promise<void>;
};

function PaginationBar({
  page,
  pages,
  onPrev,
  onNext,
}: {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-t gp-border px-4 py-3">
      <PrimeChamferButton
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className="px-3 py-2 text-xs"
      >
        Anterior
      </PrimeChamferButton>
      <span className="gp-mono text-xs gp-text-muted">
        {page} / {pages}
      </span>
      <PrimeChamferButton
        type="button"
        disabled={page >= pages}
        onClick={onNext}
        className="px-3 py-2 text-xs"
      >
        Siguiente
      </PrimeChamferButton>
    </div>
  );
}

export function ExerciseLibraryView({
  mode,
  userId,
  exercisesError,
  onRefreshLegacy,
}: ExerciseLibraryViewProps) {
  const [activeTab, setActiveTab] = useState<ExerciseCatalogTab>('catalog');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customSearch, setCustomSearch] = useState('');
  const [catalogExercises, setCatalogExercises] = useState<Exercise[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [catalogPagination, setCatalogPagination] = useState<ExercisesPagination | null>(null);
  const [customPagination, setCustomPagination] = useState<ExercisesPagination | null>(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const [customPage, setCustomPage] = useState(1);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Exercise | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadCatalogMuscles = useCallback(async () => {
    try {
      const list = await listExerciseMuscles({ source: 'catalog' });
      setMuscles(list);
      setSelectedMuscle((prev) => {
        if (prev && list.includes(prev)) return prev;
        return list[0] ?? '';
      });
    } catch {
      setMuscles([]);
      setSelectedMuscle('');
    }
  }, []);

  const loadCatalogStats = useCallback(async () => {
    try {
      const result = await listExercisesPaginated({ source: 'catalog', page: 1, perPage: 1 });
      setCatalogTotal(result.pagination.total);
    } catch {
      setCatalogTotal(0);
    }
  }, []);

  useEffect(() => {
    void loadCatalogMuscles();
    void loadCatalogStats();
  }, [loadCatalogMuscles, loadCatalogStats]);

  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    setLoadError(null);
    try {
      const q = catalogSearch.trim();
      if (q.length >= 2) {
        const results = await searchExercises(q);
        setCatalogExercises(results);
        setCatalogPagination({
          page: 1,
          perPage: results.length,
          total: results.length,
          pages: 1,
        });
      } else if (selectedMuscle) {
        const result = await listExercisesPaginated({
          source: 'catalog',
          muscle: selectedMuscle,
          page: catalogPage,
          perPage: 24,
        });
        setCatalogExercises(result.exercises);
        setCatalogPagination(result.pagination);
      } else {
        const result = await listExercisesPaginated({
          source: 'catalog',
          page: catalogPage,
          perPage: 24,
        });
        setCatalogExercises(result.exercises);
        setCatalogPagination(result.pagination);
      }
    } catch (error) {
      setCatalogExercises([]);
      setLoadError(
        error instanceof Error ? error.message : 'No se pudo cargar el catálogo de ejercicios',
      );
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [catalogSearch, selectedMuscle, catalogPage]);

  const loadCustom = useCallback(async () => {
    setIsLoadingCustom(true);
    try {
      const result = await listExercisesPaginated({
        customOnly: true,
        source: 'custom',
        q: customSearch.trim() || undefined,
        page: customPage,
        perPage: 24,
      });
      setCustomExercises(result.exercises);
      setCustomPagination(result.pagination);
    } catch (error) {
      setCustomExercises([]);
      setLoadError(
        error instanceof Error ? error.message : 'No se pudieron cargar tus ejercicios custom',
      );
    } finally {
      setIsLoadingCustom(false);
    }
  }, [customSearch, customPage]);

  useEffect(() => {
    if (activeTab === 'catalog') {
      void loadCatalog();
    }
  }, [activeTab, loadCatalog]);

  useEffect(() => {
    if (activeTab === 'custom') {
      void loadCustom();
    }
  }, [activeTab, loadCustom]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCatalogMuscles(), loadCatalogStats(), loadCatalog(), loadCustom()]);
    await onRefreshLegacy?.();
  }, [loadCatalogMuscles, loadCatalogStats, loadCatalog, loadCustom, onRefreshLegacy]);

  const allCustomForKpi = customExercises;
  const catalogForKpi = catalogExercises;
  const withAnimation =
    catalogForKpi.filter((ex) => ex.animationUrl).length +
    allCustomForKpi.filter((ex) => ex.animationUrl).length;
  const customTotal = customPagination?.total ?? customExercises.length;

  const filteredCustom = useMemo(() => {
    const q = customSearch.trim().toLowerCase();
    if (!q) return customExercises;
    return customExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscle.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q),
    );
  }, [customExercises, customSearch]);

  const handleSync = async () => {
    if (mode !== 'admin') return;
    setIsSyncing(true);
    try {
      const result = await syncExerciseCatalog();
      setSyncSummary(
        `Sincronizados ${result.syncedMuscles} grupos · ${result.totalCached} en caché (+${result.added})`,
      );
      toast.success('Catálogo sincronizado');
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo sincronizar el catálogo');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteExercise(pendingDeleteId);
      await refreshAll();
      toast.success('Ejercicio eliminado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleMatch = async (exercise: Exercise) => {
    try {
      await matchExerciseAnimation(exercise.id);
      await refreshAll();
      toast.success('Búsqueda de animación completada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo buscar animación');
    }
  };

  const handleUploadPick = (exercise: Exercise) => {
    setUploadTarget(exercise);
    uploadInputRef.current?.click();
  };

  const handleUploadPreviewClose = () => {
    setUploadTarget(null);
    setPendingUploadFile(null);
  };

  const handleConfirmUpload = async (file: File) => {
    if (!uploadTarget) return;
    setIsUploading(true);
    try {
      await uploadExerciseMedia(uploadTarget.id, file);
      await refreshAll();
      toast.success('Animación publicada');
      handleUploadPreviewClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const displayError = exercisesError ?? loadError;
  const isLoading = activeTab === 'catalog' ? isLoadingCatalog : isLoadingCustom;

  if (isLoading && catalogExercises.length === 0 && customExercises.length === 0 && !displayError) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg gp-bg-surface-high" />
        <Skeleton className="h-96 rounded-lg gp-bg-surface-high" />
      </div>
    );
  }

  const showCatalogGrid =
    muscles.length > 0 || catalogSearch.trim().length >= 2;

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Ejercicios"
        subtitle={
          mode === 'admin'
            ? 'Explora el catálogo ExerciseDB y gestiona ejercicios custom'
            : 'Explora el catálogo y crea tus ejercicios con animación'
        }
        action={
          <PrimeChamferButton onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Crear ejercicio
          </PrimeChamferButton>
        }
      />

      {displayError ? (
        <div
          className="gp-module rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-100"
          role="alert"
        >
          <p className="font-medium">No se pudo conectar con la API de ejercicios</p>
          <p className="gp-mono mt-1 text-xs opacity-90">{displayError}</p>
          <p className="gp-mono mt-2 text-xs opacity-75">
            Verifica que el backend esté activo, que hayas iniciado sesión con JWT y que
            NEXT_PUBLIC_DATA_SOURCE_ROUTINES=api.
          </p>
        </div>
      ) : null}

      <PrimeKpiStrip
        items={[
          { label: 'Catálogo', value: catalogTotal, icon: Dumbbell },
          { label: 'Mis custom', value: customTotal, icon: Sparkles },
          { label: 'Con animación', value: withAnimation, icon: Film },
        ]}
      />

      {mode === 'admin' ? (
        <PrimeModule modId="61" title="SYNC_EXERCISEDB">
          <ExerciseSyncBanner
            onSync={handleSync}
            isSyncing={isSyncing}
            lastSyncSummary={syncSummary}
          />
        </PrimeModule>
      ) : null}

      <PrimeModule modId="62" title="FILTROS_CATÁLOGO">
        <div className="space-y-4 p-4">
          <ExerciseCatalogTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'catalog' ? (
            <ExerciseMuscleFilter
              muscles={muscles}
              selectedMuscle={selectedMuscle}
              onMuscleChange={(muscle) => {
                setSelectedMuscle(muscle);
                setCatalogPage(1);
              }}
              search={catalogSearch}
              onSearchChange={(value) => {
                setCatalogSearch(value);
                setCatalogPage(1);
              }}
              showMuscleSelect={muscles.length > 0}
            />
          ) : null}
        </div>
      </PrimeModule>

      {activeTab === 'catalog' ? (
        <PrimeModule modId="63" title="INVENTARIO_CATÁLOGO">
          {muscles.length === 0 && catalogSearch.trim().length < 2 && !isLoadingCatalog ? (
            <div className="p-6 text-center">
              <p className="text-sm gp-text-primary">No hay ejercicios de catálogo en caché.</p>
              <p className="gp-mono mt-2 text-xs gp-text-muted">
                {mode === 'admin'
                  ? 'Usa «Sincronizar catálogo» para cargar músculos y animaciones desde ExerciseDB.'
                  : 'El administrador debe sincronizar el catálogo antes de explorarlo por músculo.'}
              </p>
            </div>
          ) : isLoadingCatalog ? (
            <Skeleton className="m-4 h-64 rounded-lg gp-bg-surface-high" />
          ) : showCatalogGrid ? (
            <PrimeExerciseCatalogGrid exercises={catalogExercises} mode="catalog" />
          ) : null}
          {catalogPagination ? (
            <PaginationBar
              page={catalogPage}
              pages={catalogPagination.pages}
              onPrev={() => setCatalogPage((p) => Math.max(1, p - 1))}
              onNext={() => setCatalogPage((p) => p + 1)}
            />
          ) : null}
        </PrimeModule>
      ) : (
        <PrimeModule modId="64" title="INVENTARIO_CUSTOM">
          {isLoadingCustom ? (
            <Skeleton className="m-4 h-64 rounded-lg gp-bg-surface-high" />
          ) : (
            <PrimeExerciseCatalogGrid
              exercises={filteredCustom}
              mode="custom"
              search={customSearch}
              onSearchChange={setCustomSearch}
              showSearch
              canManage={(exercise) => canManageExercise(exercise, mode, userId)}
              onEdit={(exercise) => {
                if (canManageExercise(exercise, mode, userId)) {
                  setEditingExercise(exercise);
                }
              }}
              onDelete={(id) => setPendingDeleteId(id)}
              onMatch={handleMatch}
              onUpload={handleUploadPick}
            />
          )}
          {customPagination ? (
            <PaginationBar
              page={customPage}
              pages={customPagination.pages}
              onPrev={() => setCustomPage((p) => Math.max(1, p - 1))}
              onNext={() => setCustomPage((p) => p + 1)}
            />
          ) : null}
        </PrimeModule>
      )}

      <ExerciseFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={(exercise) => {
          void refreshAll();
          setIsFormOpen(false);
          if (!exercise.animationUrl) {
            setEditingExercise(exercise);
          }
        }}
        prime
      />

      <ExerciseFormModal
        open={editingExercise !== null}
        onClose={() => setEditingExercise(null)}
        onSaved={() => void refreshAll()}
        initialExercise={editingExercise}
        prime
      />

      <ExerciseUploadPreviewModal
        open={uploadTarget !== null && pendingUploadFile !== null}
        exercise={uploadTarget}
        file={pendingUploadFile}
        isUploading={isUploading}
        onClose={handleUploadPreviewClose}
        onConfirm={handleConfirmUpload}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Eliminar ejercicio"
        description="¿Eliminar este ejercicio custom? Si está en rutinas activas se desactivará."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => void handleDelete()}
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/gif,image/webp,video/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPendingUploadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
