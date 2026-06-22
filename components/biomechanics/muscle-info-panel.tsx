'use client';

import type { ExercisePhase, MuscleGroup } from '@/lib/api/contracts/biomechanics';
import { muscleLabel } from '@/lib/biomechanics/muscle-map';

interface MuscleInfoPanelProps {
  ejercicio: string;
  faseActiva: ExercisePhase | null;
}

function MuscleRow({ title, muscles }: { title: string; muscles: MuscleGroup[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#8fa88a]">{title}</p>
      {muscles.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-1">
          {muscles.map((muscle) => (
            <li
              key={muscle}
              className="border border-[#68ca62]/30 bg-[#68ca62]/10 px-2 py-0.5 text-[11px] text-[#dce5de]"
            >
              {muscleLabel(muscle)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[11px] text-[#8fa88a]">—</p>
      )}
    </div>
  );
}

export function MuscleInfoPanel({ ejercicio, faseActiva }: MuscleInfoPanelProps) {
  return (
    <div className="w-full max-w-xs space-y-4 border border-[#68ca62]/20 bg-[#0d130f]/80 p-4 backdrop-blur">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#68ca62]">EJERCICIO</p>
        <h2 className="text-lg font-semibold text-[#dce5de]">{ejercicio}</h2>
      </header>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#8fa88a]">FASE_ACTUAL</p>
        <p className="text-sm text-[#68ca62]">{faseActiva?.nombre ?? 'Sin fase'}</p>
        {faseActiva ? (
          <p className="mt-0.5 text-[11px] text-[#8fa88a]">
            Intensidad {Math.round(faseActiva.intensidad * 100)}%
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <MuscleRow title="AGONISTA" muscles={faseActiva?.agonistas ?? []} />
        <MuscleRow title="SINERGISTA" muscles={faseActiva?.sinergistas ?? []} />
        <MuscleRow title="ANTAGONISTA" muscles={faseActiva?.antagonistas ?? []} />
      </div>
    </div>
  );
}
