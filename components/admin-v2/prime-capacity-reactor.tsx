'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PrimeSegmentRing } from '@/components/admin-v2/prime-segment-ring';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import type { CapacityTrendPoint } from '@/hooks/use-admin-dashboard-metrics';

type PrimeCapacityReactorProps = {
  loadPercent: number;
  totalSlots: number;
  currentLoad: number;
  trend7d: CapacityTrendPoint[];
};

type TooltipPayload = {
  payload?: CapacityTrendPoint;
};

function CapacityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="gp-reactor-tooltip gp-module-corner">
      <p className="gp-metric text-[#becab8]">{label ?? point.day}</p>
      <p className="gp-metric mt-1 text-[#83e77b]">{point.load} sesiones</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#899483]">
        Carga operativa — 7d
      </p>
    </div>
  );
}

export function PrimeCapacityReactor({
  loadPercent,
  totalSlots,
  currentLoad,
  trend7d,
}: PrimeCapacityReactorProps) {
  const rawId = useId().replace(/:/g, '');
  const gradId = `capacity-spark-${rawId}`;
  const isHighLoad = loadPercent >= 85;

  return (
    <PrimeModule modId="07" title="SATURACIÓN_OPERATIVA" variant="reactor" className="gp-phosphor-glow">
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
        <div
          className="relative mx-auto flex shrink-0 items-center justify-center"
          aria-label={`Saturación operativa ${loadPercent} por ciento`}
        >
          <PrimeSegmentRing value={loadPercent} size={200} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="gp-display text-xs uppercase tracking-widest text-[#83e77b]">
              REACTOR
            </span>
            <span className="gp-metric mt-1 text-4xl font-bold text-[#dce5de]">
              {loadPercent}%
            </span>
            <span
              className={`gp-metric mt-2 max-w-[160px] text-xs ${
                isHighLoad ? 'text-[#ffb4ab]' : 'text-[#83e77b]'
              }`}
            >
              Capacidad: {totalSlots} Atletas / Carga actual: {currentLoad}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="gp-mono mb-3 text-xs uppercase text-[#becab8]">
            Tendencia carga operativa — sesiones / 7d
          </p>
          <div className="gp-reactor-chart h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend7d} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#68ca62" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#68ca62" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#899483', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#899483', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  content={<CapacityTooltip />}
                  cursor={{ stroke: '#68ca62', strokeOpacity: 0.35 }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#83e77b"
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PrimeModule>
  );
}
