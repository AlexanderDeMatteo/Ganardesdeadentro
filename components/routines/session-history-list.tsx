'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildYAxisDomain } from '@/lib/metrics-chart-utils';
import type { SessionLog } from '@/lib/data/types';

interface ExerciseProgressChartProps {
  exerciseName: string;
  points: Array<{ date: string; maxWeightKg: number }>;
}

export function ExerciseProgressChart({ exerciseName, points }: ExerciseProgressChartProps) {
  const chartData = useMemo(
    () =>
      points.map((p) => ({
        label: p.date.slice(5),
        weight: p.maxWeightKg,
      })),
    [points],
  );

  const domain = buildYAxisDomain(chartData.map((d) => d.weight));

  if (points.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        Registra al menos 2 sesiones con peso para ver la progresión de {exerciseName}.
      </p>
    );
  }

  return (
    <div className="h-40 w-full">
      <p className="mb-2 text-xs font-semibold text-foreground">Carga máxima — {exerciseName}</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} stroke="#6b7280" />
          <YAxis
            domain={domain}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            stroke="#6b7280"
            width={36}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1d1f',
              border: '1px solid #3f4449',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            name="Peso máx."
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: '#22d3ee' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SessionHistoryListProps {
  sessionLogs: SessionLog[];
  routineNames: Record<string, string>;
  athleteId: string;
  getProgress: (
    athleteId: string,
    exerciseId: string,
  ) => Promise<Array<{ date: string; maxWeightKg: number; sessionId: string }>>;
}

export function SessionHistoryList({
  sessionLogs,
  routineNames,
  athleteId,
  getProgress,
}: SessionHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progressCache, setProgressCache] = useState<
    Record<string, Array<{ date: string; maxWeightKg: number }>>
  >({});

  const recent = sessionLogs.slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aún no hay sesiones registradas. Completa tu primer entrenamiento para ver el historial.
        </p>
      </div>
    );
  }

  const loadProgress = async (exerciseId: string) => {
    if (progressCache[exerciseId]) return;
    const pts = await getProgress(athleteId, exerciseId);
    setProgressCache((prev) => ({
      ...prev,
      [exerciseId]: pts.map((p) => ({ date: p.date, maxWeightKg: p.maxWeightKg })),
    }));
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-6">
      <h3 className="mb-4 text-lg font-bold uppercase text-foreground">Historial de sesiones</h3>
      <ul className="space-y-3">
        {recent.map((session) => {
          const name = routineNames[session.routineId] ?? 'Rutina';
          const pct =
            session.totalSets > 0
              ? Math.round(((session.completedSets ?? 0) / session.totalSets) * 100)
              : 0;
          const failed = session.failedSets ?? 0;
          const isOpen = expandedId === session.id;
          const exercises = Array.from(
            new Map(
              (session.setLogs ?? []).map((l) => [l.exerciseId, l.exerciseName]),
            ).entries(),
          );

          return (
            <li key={session.id} className="rounded-lg border border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setExpandedId(isOpen ? null : session.id)}
              >
                <div>
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.scheduledDate} · {pct}% completado
                    {failed > 0 && (
                      <span className="text-amber-400"> · {failed} fallos</span>
                    )}
                  </p>
                </div>
                <span
                  className={
                    session.sessionOutcome === 'completed'
                      ? 'text-xs text-lime-400'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {session.sessionOutcome === 'completed' ? 'Completada' : 'Parcial'}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-border px-4 py-3">
                  <ul className="space-y-2 text-sm">
                    {(session.setLogs ?? []).map((l) => (
                      <li key={`${l.exerciseId}-${l.setNumber}`} className="flex justify-between gap-2">
                        <span>
                          {l.exerciseName} s{l.setNumber}
                        </span>
                        <span className="text-muted-foreground">
                          {l.repsLogged}/{l.repsTarget}
                          {l.weightKg != null ? ` · ${l.weightKg} kg` : ''}
                          {l.result === 'failed' && ' · Me rindo'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {exercises.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {exercises.map(([exId, exName]) => (
                        <div key={exId}>
                          <button
                            type="button"
                            className="text-xs font-medium text-cyan-400 hover:underline"
                            onClick={() => void loadProgress(exId)}
                          >
                            Ver progresión: {exName}
                          </button>
                          {progressCache[exId] && (
                            <div className="mt-2">
                              <ExerciseProgressChart
                                exerciseName={exName}
                                points={progressCache[exId]}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
