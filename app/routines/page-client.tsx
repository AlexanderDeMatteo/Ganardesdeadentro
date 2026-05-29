'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { AssignedRoutineView } from '@/components/routines/assigned-routine-view';

function RoutinesContent() {
  return (
    <>
      <Navbar />
      <main className="brand-shell min-h-screen overflow-x-hidden">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-10 sm:pb-12 lg:px-8">
          <div className="mb-6 min-w-0 space-y-2 sm:mb-8">
            <p className="brand-kicker">Plan de combate</p>
            <h1 className="brand-title break-words text-3xl font-black sm:text-5xl md:text-6xl">Mis Rutinas</h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Rutina asignada por tu entrenador. Marca series y registra tu progreso.
            </p>
          </div>

          <AssignedRoutineView />
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
