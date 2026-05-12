'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMetrics } from '@/hooks/use-metrics';

interface MetricsChartProps {
  title: string;
  metric: 'weight' | 'bodyFat' | 'muscleMass' | 'biceps' | 'chest' | 'waist' | 'hips' | 'thighs' | 'calves';
  unit: string;
  color: string;
}

export function MetricsChart({ title, metric, unit, color }: MetricsChartProps) {
  const { getChartData } = useMetrics();
  const data = getChartData(metric);

  if (data.length === 0) {
    return (
      <div className="brand-card rounded-2xl p-8">
        <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-6">{title}</h3>
        <div className="h-64 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
          <p className="text-muted-foreground">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-card rounded-2xl p-8">
      <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="var(--muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            style={{ fontSize: '12px' }}
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 5 }}
            activeDot={{ r: 7 }}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
