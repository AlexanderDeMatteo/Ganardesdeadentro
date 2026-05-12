'use client';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/** Demo: días con actividad registrada (true = entreno / métrica). */
const WEEK_ACTIVE = [true, false, true, true, false, true, true] as const;

export function FitnessDashboardWeekConsistency() {
  const activeCount = WEEK_ACTIVE.filter(Boolean).length;
  const consistencyPct = Math.round((activeCount / 7) * 100);

  return (
    <div className="dashboard-v3-panel rounded-2xl border border-[#2a2e32] p-6">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">
        Métricas recientes
      </h3>
      <p className="mb-4 text-sm font-bold text-white">Esta semana</p>
      <div className="mb-6 flex justify-between gap-1">
        {WEEK_ACTIVE.map((on, i) => (
          <div key={DAY_LABELS[i]} className="flex flex-col items-center gap-2">
            <span
              className={
                on
                  ? 'size-3 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]'
                  : 'size-3 rounded-full bg-[#374151]'
              }
              aria-label={on ? `${DAY_LABELS[i]}: actividad` : `${DAY_LABELS[i]}: sin actividad`}
            />
            <span className="text-[10px] text-[#9ca3af]">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
      <div className="mb-2 flex justify-between text-xs text-[#d1d5db]">
        <span>Consistencia</span>
        <span className="text-lime-400">{consistencyPct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#374151]">
        <div
          className="h-full rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.45)]"
          style={{ width: `${consistencyPct}%` }}
        />
      </div>
    </div>
  );
}
