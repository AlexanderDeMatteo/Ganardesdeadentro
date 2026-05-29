'use client';

import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { MetricsFeaturedChartPanel } from '@/components/metrics/metrics-featured-chart-panel';
import { METRICS_REPLICA_PANEL_BG } from '@/components/metrics/metrics-replica-panel-tokens';
import { useMetrics } from '@/hooks/use-metrics';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dumbbell, MoreHorizontal, Percent, Pencil, Scale, Trash2, Weight } from 'lucide-react';

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
  const { entries, getLatestEntry, updateEntry, removeEntry, addEntry } = useMetrics();
  const latest = getLatestEntry();
  const [menuRowId, setMenuRowId] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState('');
  const [draftBodyFat, setDraftBodyFat] = useState('');
  const [draftMuscleMass, setDraftMuscleMass] = useState('');
  const [quickWeight, setQuickWeight] = useState('');
  const [quickBodyFat, setQuickBodyFat] = useState('');
  const [quickMuscleMass, setQuickMuscleMass] = useState('');
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(null);

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
    return [...sorted].slice(-6).reverse();
  }, [sorted]);

  const openEdit = (rowId: string) => {
    const row = sorted.find((e) => e.id === rowId);
    if (!row) return;
    setEditingRowId(rowId);
    setMenuRowId(null);
    setDraftWeight(typeof row.weight === 'number' ? row.weight.toString() : '');
    setDraftBodyFat(typeof row.bodyFat === 'number' ? row.bodyFat.toString() : '');
    setDraftMuscleMass(typeof row.muscleMass === 'number' ? row.muscleMass.toString() : '');
  };

  const closeEditModal = () => {
    setEditingRowId(null);
  };

  const saveEdit = () => {
    if (!editingRowId) return;
    const parse = (raw: string) => {
      const v = parseFloat(raw.replace(',', '.'));
      return Number.isFinite(v) ? v : undefined;
    };
    updateEntry(editingRowId, {
      weight: parse(draftWeight),
      bodyFat: parse(draftBodyFat),
      muscleMass: parse(draftMuscleMass),
    });
    setEditingRowId(null);
    setMenuRowId(null);
  };

  const askDelete = (rowId: string) => {
    setPendingDeleteRowId(rowId);
    setMenuRowId(null);
  };

  const confirmDelete = () => {
    if (!pendingDeleteRowId) return;
    removeEntry(pendingDeleteRowId);
    if (editingRowId === pendingDeleteRowId) {
      setEditingRowId(null);
    }
    setPendingDeleteRowId(null);
  };

  const parseInput = (raw: string): number | undefined => {
    const v = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(v) ? v : undefined;
  };

  const hasQuickData = quickWeight.trim() || quickBodyFat.trim() || quickMuscleMass.trim();
  const submitQuickAdd = () => {
    if (!hasQuickData) return;
    const entry = {
      date: new Date().toISOString(),
      weight: parseInput(quickWeight),
      bodyFat: parseInput(quickBodyFat),
      muscleMass: parseInput(quickMuscleMass),
    };
    const hasAny = typeof entry.weight === 'number' || typeof entry.bodyFat === 'number' || typeof entry.muscleMass === 'number';
    if (!hasAny) return;
    addEntry(entry);
    setQuickWeight('');
    setQuickBodyFat('');
    setQuickMuscleMass('');
  };

  const wPct = pctChange(prev?.weight, latest?.weight);
  const bfPct = pctChange(prev?.bodyFat, latest?.bodyFat);
  const mmPct = pctChange(prev?.muscleMass, latest?.muscleMass);

  const weightVal =
    latest?.weight != null ? `${latest.weight.toFixed(1)} kg` : '—';
  const bfVal =
    latest?.bodyFat != null
      ? `${latest.bodyFat.toFixed(1)}%${latest.bodyFatSource === 'estimated' ? ' (est.)' : ''}`
      : '—';
  const mmVal =
    latest?.muscleMass != null
      ? `${latest.muscleMass.toFixed(1)} kg${latest.muscleMassSource === 'estimated' ? ' (est.)' : ''}`
      : '—';

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

            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-foreground">Historial biométrico</h3>

              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick add</p>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      placeholder="Peso (kg)"
                      value={quickWeight}
                      onChange={(e) => setQuickWeight(e.target.value)}
                      className="h-11 rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Grasa (%)"
                      value={quickBodyFat}
                      onChange={(e) => setQuickBodyFat(e.target.value)}
                      className="h-11 rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Músculo (kg)"
                      value={quickMuscleMass}
                      onChange={(e) => setQuickMuscleMass(e.target.value)}
                      className="h-11 rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button type="button" className="h-11 w-full" onClick={submitQuickAdd}>
                      Guardar rápido
                    </Button>
                  </div>
                </div>

                {historialRows.map((row) => (
                  <div key={`mobile-${row.id}`} className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(row.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          onClick={() => setMenuRowId((id) => (id === row.id ? null : row.id))}
                          aria-label="Abrir acciones del registro"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {menuRowId === row.id ? (
                          <div className="absolute right-0 top-12 z-20 w-36 rounded-md border border-border bg-card p-1 shadow-lg">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-foreground hover:bg-muted"
                              onClick={() => openEdit(row.id)}
                            >
                              <Pencil className="size-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-destructive hover:bg-muted"
                              onClick={() => askDelete(row.id)}
                            >
                              <Trash2 className="size-3.5" />
                              Eliminar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Peso</p>
                        <p className="font-semibold text-foreground">{row.weight != null ? `${row.weight.toFixed(1)} kg` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Grasa</p>
                        <p className="font-semibold text-secondary">{row.bodyFat != null ? `${row.bodyFat.toFixed(1)}%` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Músculo</p>
                        <p className="font-semibold text-foreground">{row.muscleMass != null ? `${row.muscleMass.toFixed(1)} kg` : '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-[620px] w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Peso</th>
                        <th className="px-3 py-2">Grasa</th>
                        <th className="px-3 py-2">Músculo</th>
                        <th className="w-[72px] px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/60 bg-muted/20">
                        <td className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          Quick Add
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            placeholder="kg"
                            value={quickWeight}
                            onChange={(e) => setQuickWeight(e.target.value)}
                            className="h-11 w-24 rounded-md border border-border/70 bg-black/50 px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            placeholder="%"
                            value={quickBodyFat}
                            onChange={(e) => setQuickBodyFat(e.target.value)}
                            className="h-11 w-20 rounded-md border border-border/70 bg-black/50 px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            placeholder="kg"
                            value={quickMuscleMass}
                            onChange={(e) => setQuickMuscleMass(e.target.value)}
                            className="h-11 w-20 rounded-md border border-border/70 bg-black/50 px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button type="button" size="sm" className="h-11 px-3" onClick={submitQuickAdd}>
                            Guardar
                          </Button>
                        </td>
                      </tr>

                      {historialRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                            Sin registros
                          </td>
                        </tr>
                      ) : (
                        historialRows.map((row) => (
                          <tr key={row.id} className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-2.5 text-foreground/90">
                              {new Date(row.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-foreground">
                              {row.weight != null ? `${row.weight.toFixed(1)} kg` : '—'}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-secondary">
                              {row.bodyFat != null ? `${row.bodyFat.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-foreground">
                              {row.muscleMass != null ? `${row.muscleMass.toFixed(1)} kg` : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex justify-end">
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                                    onClick={() => setMenuRowId((id) => (id === row.id ? null : row.id))}
                                    aria-label="Abrir acciones del registro"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </button>
                                  {menuRowId === row.id ? (
                                    <div className="absolute right-0 top-12 z-20 w-36 rounded-md border border-border bg-card p-1 shadow-lg">
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-foreground hover:bg-muted"
                                        onClick={() => openEdit(row.id)}
                                      >
                                        <Pencil className="size-3.5" />
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-destructive hover:bg-muted"
                                        onClick={() => askDelete(row.id)}
                                      >
                                        <Trash2 className="size-3.5" />
                                        Eliminar
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
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

      <Dialog open={editingRowId != null} onOpenChange={(open) => (!open ? closeEditModal() : undefined)}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Editar registro biométrico</DialogTitle>
            <DialogDescription>
              Ajusta peso, grasa y músculo. Los cambios impactan gráficos y resumen al guardar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Peso (kg)</label>
              <input
                type="text"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                className="h-11 w-full rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Grasa (%)</label>
              <input
                type="text"
                value={draftBodyFat}
                onChange={(e) => setDraftBodyFat(e.target.value)}
                className="h-11 w-full rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Músculo (kg)</label>
              <input
                type="text"
                value={draftMuscleMass}
                onChange={(e) => setDraftMuscleMass(e.target.value)}
                className="h-11 w-full rounded-md border border-border/70 bg-black/50 px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeEditModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveEdit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteRowId !== null}
        onOpenChange={(open) => !open && setPendingDeleteRowId(null)}
        title="Eliminar registro biométrico"
        description="¿Eliminar este registro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
