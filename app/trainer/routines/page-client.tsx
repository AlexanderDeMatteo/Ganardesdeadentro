'use client';

import { useState } from 'react';
import { RoutinesList } from '@/components/admin/routines-list';
import { RoutineBuilder } from '@/components/admin/routine-builder';
import { useTrainer } from '@/hooks/use-trainer';
import type { Routine } from '@/lib/data/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TrainerRoutinesPage() {
  const { routines, exercises, createRoutine, updateRoutine, deleteRoutine } = useTrainer();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  return (
    <div className="space-y-8 px-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-5xl font-bold tracking-tight">Mis rutinas</h1>
          <p className="text-lg text-muted-foreground">
            Crea rutinas personalizadas para tus atletas
          </p>
        </div>
        <Button
          onClick={() => setIsBuilderOpen(true)}
          className="h-12 gap-2 bg-gradient-to-r from-primary to-secondary px-6 text-base font-semibold"
        >
          <Plus className="h-5 w-5" />
          Crear rutina
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-secondary/20 bg-card/50 p-6">
          <p className="mb-2 text-sm text-muted-foreground">Total rutinas</p>
          <p className="text-4xl font-bold text-primary">{routines.length}</p>
        </div>
        <div className="rounded-2xl border border-secondary/20 bg-card/50 p-6">
          <p className="mb-2 text-sm text-muted-foreground">Ejercicios disponibles</p>
          <p className="text-4xl font-bold text-secondary">{exercises.length}</p>
        </div>
        <div className="rounded-2xl border border-secondary/20 bg-card/50 p-6">
          <p className="mb-2 text-sm text-muted-foreground">Ejercicios en rutinas</p>
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
          onSave={async (data) => {
            await createRoutine(data);
            setIsBuilderOpen(false);
          }}
          onClose={() => setIsBuilderOpen(false)}
        />
      )}

      {editingRoutine && (
        <RoutineBuilder
          exercises={exercises}
          mode="edit"
          initialRoutine={editingRoutine}
          onSave={async (data) => {
            await updateRoutine(editingRoutine.id, data);
            setEditingRoutine(null);
          }}
          onClose={() => setEditingRoutine(null)}
        />
      )}
    </div>
  );
}
