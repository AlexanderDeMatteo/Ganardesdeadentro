'use client';

import { useAdmin } from '@/hooks/use-admin';
import { useAuth } from '@/app/context/auth-context';
import { Users, Dumbbell, TrendingUp, Award, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { athletes, trainers, routines } = useAdmin();
  const { user } = useAuth();

  const stats = [
    {
      label: 'Atletas Total',
      value: athletes.length,
      icon: Users,
      color: 'from-primary to-secondary',
      href: '/admin/athletes',
    },
    {
      label: 'Sin Entrenador',
      value: athletes.filter(a => !a.trainerId).length,
      icon: TrendingUp,
      color: 'from-accent to-destructive',
      href: '/admin/athletes',
    },
    {
      label: 'Entrenadores',
      value: trainers.length,
      icon: Award,
      color: 'from-primary to-secondary',
      href: '/admin/trainers',
    },
    {
      label: 'Rutinas',
      value: routines.length,
      icon: Dumbbell,
      color: 'from-secondary to-accent',
      href: '/admin/routines',
    },
  ];

  const unassignedAthletes = athletes.filter(a => !a.trainerId);

  return (
    <div className="px-8 py-12 space-y-12">
      <div>
        <p className="brand-kicker">Centro de control</p>
        <h1 className="brand-title mb-2 text-5xl font-black">Panel de Administración</h1>
        <p className="text-lg text-muted-foreground">
          Bienvenido, {user?.first_name}. Gestiona tu plataforma desde aquí.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} href={stat.href}>
              <div className="group brand-card brand-card-hover h-full cursor-pointer rounded-2xl p-6">
                <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white w-fit mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-foreground">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="brand-card rounded-2xl p-8">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            Atletas Sin Entrenador
          </h2>

          {unassignedAthletes.length > 0 ? (
            <div className="space-y-3">
              {unassignedAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/5 p-4 border border-secondary/20"
                >
                  <div>
                    <p className="font-medium text-foreground">{athlete.name}</p>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <span className="rounded-full bg-orange-500/20 text-orange-500 px-3 py-1 text-xs font-semibold">
                    {athlete.membershipLevel}
                  </span>
                </div>
              ))}
              <Link href="/admin/athletes">
                <Button className="w-full mt-4">
                  Asignar Entrenadores
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Todos los atletas tienen entrenador asignado</p>
          )}
        </div>

        <div className="brand-card rounded-2xl p-8">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            Resumen Rápido
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Atletas Activos</p>
              <p className="text-3xl font-bold text-primary">{athletes.length}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <p className="text-sm text-muted-foreground mb-1">Membresías Premium</p>
              <p className="text-3xl font-bold text-secondary">
                {athletes.filter(a => a.membershipLevel === 'premium' || a.membershipLevel === 'pro').length}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Tasa de Asignación</p>
              <p className="text-3xl font-bold text-accent">
                {athletes.length > 0
                  ? Math.round(((athletes.length - unassignedAthletes.length) / athletes.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
