'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAdmin } from '@/hooks/use-admin';
import { Users, Dumbbell, TrendingUp } from 'lucide-react';

function AssignmentsManagementContent() {
  const { athletes, trainers } = useAdmin();

  const assignmentMap = athletes.reduce(
    (acc, athlete) => {
      if (athlete.trainerId) {
        if (!acc[athlete.trainerId]) {
          acc[athlete.trainerId] = [];
        }
        acc[athlete.trainerId].push(athlete);
      }
      return acc;
    },
    {} as Record<string, typeof athletes>
  );

  const unassignedAthletes = athletes.filter(a => !a.trainerId);

  return (
    <>
      <Navbar />
      <AdminSidebar />
      <main className="ml-64 min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
        <div className="px-8 py-12 space-y-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-2">Asignaciones de Entrenadores</h1>
            <p className="text-lg text-muted-foreground">
              Visualiza y gestiona la asignación de atletas a entrenadores
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atletas Totales</p>
                  <p className="text-3xl font-bold">{athletes.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asignados</p>
                  <p className="text-3xl font-bold">{athletes.length - unassignedAthletes.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Dumbbell className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sin Asignar</p>
                  <p className="text-3xl font-bold">{unassignedAthletes.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Asignaciones por Entrenador */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Carga de Trabajo por Entrenador</h2>

            <div className="grid gap-6">
              {trainers.map((trainer) => {
                const assignedAthletes = assignmentMap[trainer.id] || [];
                const capacity = 10;
                const percentage = (assignedAthletes.length / capacity) * 100;

                return (
                  <div
                    key={trainer.id}
                    className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{trainer.name}</h3>
                        <p className="text-sm text-muted-foreground">{trainer.specialization}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{assignedAthletes.length}</p>
                        <p className="text-sm text-muted-foreground">de {capacity} atletas</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="h-3 rounded-full bg-secondary/20 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 bg-gradient-to-r ${
                            percentage >= 80
                              ? 'from-red-500 to-orange-500'
                              : percentage >= 60
                              ? 'from-yellow-500 to-orange-500'
                              : 'from-primary to-secondary'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{Math.round(percentage)}% de capacidad</p>
                    </div>

                    {/* Atletas Asignados */}
                    {assignedAthletes.length > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-3">Atletas Asignados</p>
                        <div className="space-y-2">
                          {assignedAthletes.map((athlete) => (
                            <div
                              key={athlete.id}
                              className="flex items-center justify-between rounded-lg bg-secondary/5 p-3 border border-secondary/20"
                            >
                              <div>
                                <p className="font-medium text-foreground">{athlete.name}</p>
                                <p className="text-xs text-muted-foreground">{athlete.email}</p>
                              </div>
                              <span className="rounded-full bg-primary/20 text-primary px-3 py-1 text-xs font-semibold">
                                {athlete.membershipLevel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Sin atletas asignados aún</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Atletas Sin Asignar */}
          {unassignedAthletes.length > 0 && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-orange-500">Atletas Pendientes de Asignación</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unassignedAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="rounded-lg border border-orange-500/20 bg-background p-4"
                  >
                    <p className="font-semibold text-foreground mb-1">{athlete.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">{athlete.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-orange-500/20 text-orange-500 px-3 py-1 text-xs font-semibold">
                        {athlete.membershipLevel}
                      </span>
                      <span className="rounded-full bg-red-500/20 text-red-500 px-3 py-1 text-xs font-semibold">
                        Sin entrenador
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function AssignmentsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AssignmentsManagementContent />
    </ProtectedRoute>
  );
}
