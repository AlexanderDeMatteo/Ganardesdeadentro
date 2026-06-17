'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RoutineBuilder } from '@/components/admin/routine-builder';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { PrimeRoutinesGrid } from '@/components/admin-v2/prime-routines-grid';
import { useTrainer } from '@/hooks/use-trainer';
import type { Routine } from '@/lib/data/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, Layers, Plus } from 'lucide-react';

export default function TrainerV2RoutinesPageClient() {
  const {
    routines,
    exercises,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    refreshAthletes,
    isLoading,
  } = useTrainer();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [search, setSearch] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredRoutines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routines;
    return routines.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [routines, search]);

  const exercisesUsed = routines.reduce((sum, r) => sum + r.exercises.length, 0);

  const handleCreateRoutine = async (data: Parameters<typeof createRoutine>[0]) => {
    await createRoutine(data);
    toast.success('Rutina creada');
    setIsBuilderOpen(false);
  };

  const handleUpdateRoutine = async (data: Parameters<typeof createRoutine>[0]) => {
    if (!editingRoutine) return;
    await updateRoutine(editingRoutine.id, data);
    toast.success('Rutina actualizada');
    setEditingRoutine(null);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    await deleteRoutine(pendingDeleteId);
    toast.success('Rutina eliminada');
    setPendingDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg gp-bg-surface-high" />
        <Skeleton className="h-96 rounded-lg gp-bg-surface-high" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Mis rutinas"
        subtitle="Crea rutinas personalizadas para tus atletas"
        action={
          <PrimeChamferButton onClick={() => setIsBuilderOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Crear rutina
          </PrimeChamferButton>
        }
      />

      <PrimeKpiStrip
        items={[
          { label: 'Total rutinas', value: routines.length, icon: Layers },
          { label: 'Ejercicios disponibles', value: exercises.length, icon: Dumbbell },
          { label: 'Ejercicios en rutinas', value: exercisesUsed, icon: Dumbbell },
        ]}
      />

      <PrimeRoutinesGrid
        routines={filteredRoutines}
        search={search}
        onSearchChange={setSearch}
        onEdit={setEditingRoutine}
        onDelete={setPendingDeleteId}
      />

      {isBuilderOpen && (
        <RoutineBuilder
          exercises={exercises}
          mode="create"
          onSave={handleCreateRoutine}
          onClose={() => setIsBuilderOpen(false)}
          onExercisesChanged={refreshAthletes}
          prime
        />
      )}

      {editingRoutine && (
        <RoutineBuilder
          exercises={exercises}
          mode="edit"
          initialRoutine={editingRoutine}
          onSave={handleUpdateRoutine}
          onClose={() => setEditingRoutine(null)}
          onExercisesChanged={refreshAthletes}
          prime
        />
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Eliminar rutina"
        description="¿Eliminar esta rutina? Las asignaciones existentes pueden verse afectadas."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
