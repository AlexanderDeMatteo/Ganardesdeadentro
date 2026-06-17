'use client';

import Link from 'next/link';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { Mail, UserRound } from 'lucide-react';

interface MyTrainerCardProps {
  compact?: boolean;
}

export function MyTrainerCard({ compact = false }: MyTrainerCardProps) {
  const { trainer, isLoading, athleteId } = useAthleteData();

  if (isLoading) {
    return (
      <div className="gp-module gp-module-corner animate-pulse p-6">
        <div className="h-4 w-32 rounded gp-bg-surface-variant" />
        <div className="mt-4 h-6 w-48 rounded gp-bg-surface-variant" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="gp-module gp-module-corner p-6">
        <h3 className="gp-label gp-text-muted">Mi entrenador</h3>
        <p className="mt-3 text-sm gp-text-muted">
          Aún no tienes un entrenador asignado. Contacta con soporte o elige un plan Premium/Pro.
        </p>
        <Link href="/memberships" className="mt-4 inline-block text-sm gp-text-phosphor hover:underline">
          Ver membresías
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border gp-border-outline gp-bg-surface-variant p-4">
        <div className="flex size-10 items-center justify-center rounded-full gp-bg-surface gp-text-phosphor">
          <UserRound className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs gp-text-muted">Tu entrenador</p>
          <p className="truncate font-bold gp-text-primary">{trainer.name}</p>
          <p className="truncate text-xs gp-text-muted">{trainer.specialization}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gp-module gp-module-corner p-6">
      <h3 className="gp-label gp-text-muted">Mi entrenador</h3>
      <div className="mt-4 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full gp-bg-surface-variant gp-text-phosphor">
          <UserRound className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="gp-display text-xl gp-text-primary">{trainer.name}</h2>
          <p className="mt-1 text-sm gp-text-phosphor">{trainer.specialization}</p>
          {trainer.bio && (
            <p className="mt-2 text-sm leading-relaxed gp-text-muted">{trainer.bio}</p>
          )}
          <a
            href={`mailto:${trainer.email}`}
            className="mt-3 inline-flex items-center gap-2 text-sm gp-text-phosphor hover:underline"
          >
            <Mail className="size-4" aria-hidden />
            {trainer.email}
          </a>
        </div>
      </div>
      {athleteId && (
        <p className="mt-4 text-xs gp-text-dim">
          Rating: {trainer.rating.toFixed(1)} · {trainer.athletes} atletas activos
        </p>
      )}
    </div>
  );
}
