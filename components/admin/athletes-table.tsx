'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Link2, Pencil, Search, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface AthletesTableProps {
  athletes: AthleteProfile[];
  onViewDetails: (athlete: AthleteProfile) => void;
  onAssignTrainer: (athlete: AthleteProfile) => void;
  onEditAthlete?: (athlete: AthleteProfile) => void;
}

export function AthletesTable({
  athletes,
  onViewDetails,
  onAssignTrainer,
  onEditAthlete,
}: AthletesTableProps) {
  const [search, setSearch] = useState('');

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-card border-secondary/30"
        />
      </div>

      <div className="rounded-xl border border-secondary/20 bg-card/50 overflow-hidden">
        <table className="w-full" aria-label="Listado de atletas">
          <caption className="sr-only">Atletas registrados en la plataforma</caption>
          <thead className="border-b border-secondary/20 bg-secondary/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Edad</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Última métrica</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Membresía</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Entrenador</th>
              <th scope="col" className="px-6 py-3 text-center text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-secondary/10 hover:bg-secondary/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{athlete.name}</p>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm">{athlete.email}</td>
                <td className="px-6 py-4 text-sm">{athlete.age}</td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const m = athlete.latestMetric ?? athlete.metrics;
                    return m ? `${m.weight} kg · ${m.bodyFat}%` : '—';
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    athlete.membershipLevel === 'pro'
                      ? 'bg-primary/20 text-primary'
                      : athlete.membershipLevel === 'premium'
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {athlete.membershipLevel.charAt(0).toUpperCase() + athlete.membershipLevel.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {athlete.trainerId ? (
                    <span className="text-green-500 font-medium">Asignado</span>
                  ) : (
                    <span className="text-amber-500 font-medium">Sin asignar</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
                    >
                      <Link
                        href={`/admin/athletes/${athlete.id}/nutrition`}
                        aria-label={`Nutrición de ${athlete.name}`}
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(athlete)}
                      className="h-8 w-8 p-0 border-primary/30 hover:bg-primary/10"
                      aria-label={`Ver detalle de ${athlete.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAthlete?.(athlete)}
                      disabled={!onEditAthlete}
                      className="h-8 w-8 p-0 border-secondary/30 hover:bg-secondary/10"
                      aria-label={`Editar ${athlete.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignTrainer(athlete)}
                      className="h-8 w-8 p-0 border-secondary/30 hover:bg-secondary/10"
                      aria-label={`Asignar entrenador a ${athlete.name}`}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron atletas</p>
        </div>
      )}
    </div>
  );
}
