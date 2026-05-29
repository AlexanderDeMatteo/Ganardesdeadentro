'use client';

import { AthleteProfile } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { X, Mail, Cake, Ruler, Weight, Calendar, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

interface AthleteDetailModalProps {
  athlete: AthleteProfile | null;
  onClose: () => void;
  /** Base path for nutrition editor, e.g. /admin/athletes or /trainer/athletes */
  nutritionBasePath?: string;
}

export function AthleteDetailModal({
  athlete,
  onClose,
  nutritionBasePath = '/admin/athletes',
}: AthleteDetailModalProps) {
  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-secondary/20 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary/20 px-8 py-6">
          <h2 className="text-2xl font-bold">{athlete.name}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 border-secondary/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{athlete.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Cake className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Edad</p>
                  <p className="font-medium">{athlete.age} años</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm">Género:</span>
                <p className="font-medium">{athlete.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                  <p className="font-medium">{new Date(athlete.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medidas Físicas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Medidas Físicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 rounded-lg bg-secondary/5 p-4">
                <Weight className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="font-semibold text-lg">{athlete.weight} kg</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-secondary/5 p-4">
                <Ruler className="h-5 w-5 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Altura</p>
                  <p className="font-semibold text-lg">{athlete.height} cm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Actuales */}
          {athlete.metrics && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Métricas Actuales</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Peso</p>
                  <p className="text-2xl font-bold text-primary">{athlete.metrics.weight} kg</p>
                </div>
                <div className="rounded-lg bg-secondary/10 p-4 border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-1">Grasa Corporal</p>
                  <p className="text-2xl font-bold text-secondary">{athlete.metrics.bodyFat}%</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Masa Muscular</p>
                  <p className="text-2xl font-bold text-accent">{athlete.metrics.muscleMass} kg</p>
                </div>
              </div>
            </div>
          )}

          {/* Membresía */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información de Membresía</h3>
            <div className={`rounded-lg p-4 border ${
              athlete.membershipLevel === 'pro'
                ? 'bg-primary/10 border-primary/20'
                : athlete.membershipLevel === 'premium'
                ? 'bg-secondary/10 border-secondary/20'
                : 'bg-muted/10 border-muted/20'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">Tipo de Membresía</p>
              <p className="text-xl font-semibold capitalize">{athlete.membershipLevel}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary/20 px-8 py-4 flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={`${nutritionBasePath}/${athlete.id}/nutrition`} onClick={onClose}>
              <UtensilsCrossed className="mr-2 size-4" aria-hidden />
              Nutrición
            </Link>
          </Button>
          <Button onClick={onClose} className="bg-gradient-to-r from-primary to-secondary">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
