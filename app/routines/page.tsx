'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Dumbbell, Clock, Target } from 'lucide-react';

const routines = [
  { id: 1, name: 'Día Piernas', duration: 60, exercises: 6, difficulty: 'Intermedio', description: 'Enfocado en cuádriceps, isquiotibiales y glúteos' },
  { id: 2, name: 'Pecho y Tríceps', duration: 45, exercises: 5, difficulty: 'Intermedio', description: 'Desarrollo completo del pecho y tríceps' },
  { id: 3, name: 'Espalda y Bíceps', duration: 50, exercises: 5, difficulty: 'Intermedio', description: 'Fortalecimiento de espalda y brazos' },
  { id: 4, name: 'Hombros y Cardio', duration: 55, exercises: 7, difficulty: 'Avanzado', description: 'Deltoides y ejercicio cardiovascular' },
];

function RoutinesContent() {
  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-2">
            <p className="brand-kicker">Plan de combate</p>
            <h1 className="brand-title text-5xl font-black">Mis Rutinas</h1>
            <p className="text-lg text-muted-foreground">Elige una rutina y comienza tu entrenamiento</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="group brand-card brand-card-hover rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 p-3">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                    {routine.difficulty}
                  </span>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">{routine.name}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{routine.description}</p>

                <div className="flex items-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{routine.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-secondary" />
                    <span>{routine.exercises} ejercicios</span>
                  </div>
                </div>

                <Button className="w-full">
                  Iniciar Rutina
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function RoutinesPage() {
  return (
    <ProtectedRoute>
      <RoutinesContent />
    </ProtectedRoute>
  );
}
