'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface AthletesListProps {
  athletes: AthleteProfile[];
  getRoutineLabel: (athleteId: string) => string;
  onViewDetails: (athlete: AthleteProfile) => void;
}

export function AthletesList({ athletes, getRoutineLabel, onViewDetails }: AthletesListProps) {
  const [search, setSearch] = useState('');

  const filtered = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 border-secondary/30 bg-card pl-10"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary/20 bg-card/50">
        <table className="w-full" aria-label="Mis atletas asignados">
          <caption className="sr-only">Listado de atletas del entrenador</caption>
          <thead className="border-b border-secondary/20 bg-secondary/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Membresía</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Rutina activa</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Métricas</th>
              <th scope="col" className="px-6 py-3 text-center text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-secondary/10 transition-colors hover:bg-secondary/5"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{athlete.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{athlete.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      athlete.membershipLevel === 'pro'
                        ? 'bg-primary/20 text-primary'
                        : athlete.membershipLevel === 'premium'
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {athlete.membershipLevel.charAt(0).toUpperCase() + athlete.membershipLevel.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{getRoutineLabel(athlete.id)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {athlete.metrics
                    ? `${athlete.metrics.weight} kg · ${athlete.metrics.bodyFat}% grasa`
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 border-primary/30 px-2 hover:bg-primary/10"
                    >
                      <Link
                        href={`/trainer/athletes/${athlete.id}/nutrition`}
                        aria-label={`Nutrición de ${athlete.name}`}
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(athlete)}
                      className="h-8 w-8 border-primary/30 p-0 hover:bg-primary/10"
                      aria-label={`Ver detalle de ${athlete.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron atletas asignados</p>
        </div>
      )}
    </div>
  );
}
