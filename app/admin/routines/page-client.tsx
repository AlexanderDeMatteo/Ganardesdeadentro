'use client';

import { useState } from 'react';
import { RoutinesList } from '@/components/admin/routines-list';
import { RoutineBuilder } from '@/components/admin/routine-builder';
import { useAdmin } from '@/hooks/use-admin';
import type { Routine } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function RoutinesPage() {
  const { routines, exercises, createRoutine, updateRoutine, deleteRoutine } = useAdmin();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const handleCreateRoutine = async (data: Parameters<typeof createRoutine>[0]) => {
    await createRoutine(data);
    setIsBuilderOpen(false);
  };

  const handleUpdateRoutine = async (data: Parameters<typeof createRoutine>[0]) => {
    if (!editingRoutine) return;
    await updateRoutine(editingRoutine.id, data);
    setEditingRoutine(null);
  };

  return (
    <div className="px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Gestión de Rutinas</h1>
          <p className="text-lg text-muted-foreground">
            Crea y gestiona rutinas de entrenamiento para tus atletas
          </p>
        </div>

        <Button
          onClick={() => setIsBuilderOpen(true)}
          className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-base font-semibold h-12 px-6 gap-2"
        >
          <Plus className="h-5 w-5" />
          Crear Nueva Rutina
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Rutinas</p>
          <p className="text-4xl font-bold text-primary">{routines.length}</p>
        </div>

        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Ejercicios</p>
          <p className="text-4xl font-bold text-secondary">{exercises.length}</p>
        </div>

        <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Ejercicios Usados</p>
          <p className="text-4xl font-bold text-accent">
            {routines.reduce((sum, r) => sum + r.exercises.length, 0)}
          </p>
        </div>
      </div>

      <RoutinesList
        routines={routines}
        onDelete={deleteRoutine}
        onEdit={(routine) => setEditingRoutine(routine)}
      />

      {isBuilderOpen && (
        <RoutineBuilder
          exercises={exercises}
          mode="create"
          onSave={handleCreateRoutine}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}

      {editingRoutine && (
        <RoutineBuilder
          exercises={exercises}
          mode="edit"
          initialRoutine={editingRoutine}
          onSave={handleUpdateRoutine}
          onClose={() => setEditingRoutine(null)}
        />
      )}
    </div>
  );
}
