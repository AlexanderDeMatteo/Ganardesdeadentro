'use client';

import Link from 'next/link';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { Button } from '@/components/ui/button';
import { Mail, UserRound } from 'lucide-react';

interface MyTrainerCardProps {
  compact?: boolean;
}

export function MyTrainerCard({ compact = false }: MyTrainerCardProps) {
  const { trainer, isLoading, athleteId } = useAthleteData();

  if (isLoading) {
    return (
      <div className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-4 h-6 w-48 rounded bg-muted" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-6">
        <h3 className="text-xs uppercase tracking-widest text-[#9ca3af]">Mi entrenador</h3>
        <p className="mt-3 text-sm text-[#9ca3af]">
          Aún no tienes un entrenador asignado. Contacta con soporte o elige un plan Premium/Pro.
        </p>
        <Link href="/memberships" className="mt-4 inline-block text-sm text-cyan-400 hover:underline">
          Ver membresías
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#2a2e32] bg-[#23272A] p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-400">
          <UserRound className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#9ca3af]">Tu entrenador</p>
          <p className="truncate font-bold text-white">{trainer.name}</p>
          <p className="truncate text-xs text-[#9ca3af]">{trainer.specialization}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-6">
      <h3 className="mb-1 text-xs uppercase tracking-widest text-[#9ca3af]">Mi entrenador</h3>
      <div className="mt-4 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-400">
          <UserRound className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white">{trainer.name}</h2>
          <p className="mt-1 text-sm text-lime-400">{trainer.specialization}</p>
          {trainer.bio && (
            <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">{trainer.bio}</p>
          )}
          <a
            href={`mailto:${trainer.email}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline"
          >
            <Mail className="size-4" aria-hidden />
            {trainer.email}
          </a>
        </div>
      </div>
      {athleteId && (
        <p className="mt-4 text-xs text-[#6b7280]">
          Rating: {trainer.rating.toFixed(1)} · {trainer.athletes} atletas activos
        </p>
      )}
    </div>
  );
}
