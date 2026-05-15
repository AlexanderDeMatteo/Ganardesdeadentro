'use client';

import { useId, useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { MetricsFeaturedChartPanel } from '@/components/metrics/metrics-featured-chart-panel';
import { METRICS_REPLICA_PANEL_BG } from '@/components/metrics/metrics-replica-panel-tokens';
import { useMetrics } from '@/hooks/use-metrics';
import { Dumbbell, Percent, Scale, Weight } from 'lucide-react';

const LIME = '#b8ff00';
const CYAN = '#42f4ff';
const INK = '#080a0d';

const MOCK_VOLUME_SPARK = [
  { v: 92 },
  { v: 96 },
  { v: 98 },
  { v: 108 },
  { v: 118 },
  { v: 124.5 },
];

const MOCK_PRS = [
  { name: 'SQUAT', last: '155 kg', change: '+10.7%' },
  { name: 'BENCH PRESS', last: '102 kg', change: '+7.4%' },
  { name: 'DEADLIFT', last: '195 kg', change: '+8.3%' },
] as const;

function MiniSparkline({ points, color }: { points: { v: number }[]; color: string }) {
  const rawId = useId().replace(/:/g, '');
  const gradId = `rep-spark-${rawId}`;
  if (points.length < 2) {
    return <div className="h-9 w-full rounded-sm bg-white/[0.04]" aria-hidden />;
  }
  return (
    <div className="h-9 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function pctChange(prev: number | undefined, cur: number | undefined): string | null {
  if (prev == null || cur == null || prev === 0) return null;
  const p = ((cur - prev) / prev) * 100;
  const sign = p > 0 ? '+' : '';
  return `${sign}${p.toFixed(1)}%`;
}

function ReplicaKpiCard({
  label,
  valueLine,
  subLine,
  icon: Icon,
  sparkPoints,
  sparkColor,
}: {
  label: string;
  valueLine: string;
  subLine: string | null;
  icon: typeof Scale;
  sparkPoints: { v: number }[];
  sparkColor: string;
}) {
  return (
    <div
      className="flex flex-col justify-between rounded-2xl border border-white/[0.08] p-4"
      style={{ background: METRICS_REPLICA_PANEL_BG }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
        <Icon className="size-4 shrink-0 text-white/40" aria-hidden />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-black tracking-tight text-white sm:text-[1.65rem]">{valueLine}</p>
        {subLine ? (
          <p className="mt-1 text-xs font-semibold" style={{ color: subLine.startsWith('-') ? CYAN : LIME }}>
            {subLine}
          </p>
        ) : null}
      </div>
      <div className="mt-3 border-t border-white/[0.06] pt-3">
        <MiniSparkline points={sparkPoints} color={sparkColor} />
      </div>
    </div>
  );
}

export function MetricsOptionOneDesignReplica() {
  const { entries, getLatestEntry } = useMetrics();
  const latest = getLatestEntry();

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [entries],
  );

  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : undefined;

  const spark = (key: 'weight' | 'bodyFat' | 'muscleMass') =>
    sorted
      .map((e) => {
        const v = e[key];
        return typeof v === 'number' ? { v } : null;
      })
      .filter((x): x is { v: number } => x != null);

  const historialRows = useMemo(() => {
    return [...sorted].slice(-3).reverse();
  }, [sorted]);

  const wPct = pctChange(prev?.weight, latest?.weight);
  const bfPct = pctChange(prev?.bodyFat, latest?.bodyFat);
  const mmPct = pctChange(prev?.muscleMass, latest?.muscleMass);

  const weightVal =
    latest?.weight != null ? `${latest.weight.toFixed(1)} kg` : '—';
  const bfVal =
    latest?.bodyFat != null
      ? `${latest.bodyFat.toFixed(1)}%${latest.bodyFatSource === 'estimated' ? ' (est.)' : ''}`
      : '—';
  const mmVal = latest?.muscleMass != null ? `${latest.muscleMass.toFixed(1)} kg` : '—';

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{
        backgroundColor: INK,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)`,
        backgroundSize: '14px 14px',
      }}
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* 4 KPI cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ReplicaKpiCard
            label="Peso actual"
            valueLine={weightVal}
            subLine={wPct}
            icon={Scale}
            sparkPoints={spark('weight')}
            sparkColor={LIME}
          />
          <ReplicaKpiCard
            label="Grasa corporal"
            valueLine={bfVal}
            subLine={bfPct}
            icon={Percent}
            sparkPoints={spark('bodyFat')}
            sparkColor={CYAN}
          />
          <ReplicaKpiCard
            label="Masa muscular"
            valueLine={mmVal}
            subLine={mmPct}
            icon={Dumbbell}
            sparkPoints={spark('muscleMass')}
            sparkColor={LIME}
          />
          <ReplicaKpiCard
            label="Volumen total"
            valueLine="124.5 t"
            subLine="+15%"
            icon={Weight}
            sparkPoints={MOCK_VOLUME_SPARK}
            sparkColor={CYAN}
          />
        </div>

        {/* Main + sidebar */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <MetricsFeaturedChartPanel />

          <div className="space-y-4 lg:col-span-4">
            <div
              className="rounded-2xl border-2 p-4 sm:p-5"
              style={{ borderColor: LIME, background: METRICS_REPLICA_PANEL_BG }}
            >
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/80">Personal records</h3>
              <ul className="space-y-4">
                {MOCK_PRS.map((row) => (
                  <li key={row.name} className="border-b border-white/[0.06] pb-4 last:border-0 last:pb-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">{row.name}</p>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black text-white">{row.last}</span>
                      <span className="text-sm font-bold" style={{ color: LIME }}>{row.change}</span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">Último</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.08] p-4 sm:p-5" style={{ background: METRICS_REPLICA_PANEL_BG }}>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/80">Historial biométrico</h3>
              <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-white/45">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Peso</th>
                      <th className="px-3 py-2">Grasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-white/40">
                          Sin registros
                        </td>
                      </tr>
                    ) : (
                      historialRows.map((row) => (
                        <tr key={row.id} className="border-b border-white/[0.05] last:border-0">
                          <td className="px-3 py-2.5 text-white/75">
                            {new Date(row.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-white">
                            {row.weight != null ? `${row.weight.toFixed(1)} kg` : '—'}
                          </td>
                          <td className="px-3 py-2.5 font-semibold" style={{ color: CYAN }}>
                            {row.bodyFat != null ? `${row.bodyFat.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Transformación física */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white/90 sm:text-base">
              Transformación física
            </h2>
            <button
              type="button"
              className="rounded-md border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-opacity hover:opacity-90"
              style={{ borderColor: LIME, color: LIME, background: 'transparent' }}
            >
              Subir foto
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['Frontal', 'Lateral', 'Posterior'] as const).map((label, i) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08]"
                style={{ background: METRICS_REPLICA_PANEL_BG }}
              >
                <div
                  className="aspect-[3/4] bg-gradient-to-b from-zinc-700/80 via-zinc-900 to-black"
                  style={{ filter: 'grayscale(1) contrast(1.05)' }}
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.06] bg-black/60 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{label}</p>
                  <p className="text-[10px] text-white/45">15 de junio, 2024</p>
                </div>
                {i === 0 ? (
                  <span
                    className="absolute left-2 top-2 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black"
                    style={{ background: LIME }}
                  >
                    Actual
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Footer réplica */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 text-[10px] uppercase tracking-[0.16em] text-white/40 sm:flex-row">
          <span className="font-bold text-white/55">
            Be a winner — <span style={{ color: LIME }}>FitTrack</span>
          </span>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="cursor-default hover:text-white/70">Privacidad</span>
            <span className="cursor-default hover:text-white/70">Soporte</span>
            <span className="cursor-default hover:text-white/70">Términos</span>
          </div>
          <span>© 2024 Todos los derechos reservados.</span>
        </footer>
      </div>
    </div>
  );
}
