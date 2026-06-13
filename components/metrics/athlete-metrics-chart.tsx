'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { buildYAxisDomain } from '@/lib/metrics-chart-utils';

type ChartPoint = {
  date: string;
  value: number;
  fullDate: string;
};

export function AthleteMetricsChart({
  title,
  data,
  unit,
  color,
  height = 260,
}: {
  title: string;
  data: ChartPoint[];
  unit: string;
  color: string;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-secondary/20 bg-card/50 p-6">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">Sin datos suficientes para el gráfico.</p>
      </div>
    );
  }

  const yDomain = buildYAxisDomain(data.map((d) => d.value));

  return (
    <div className="rounded-xl border border-secondary/20 bg-card/50 p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={yDomain} tick={{ fontSize: 11 }} unit={unit} />
          <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, title]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
