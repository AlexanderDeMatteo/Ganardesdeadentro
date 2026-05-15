'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMetrics } from '@/hooks/use-metrics';
import { cn } from '@/lib/utils';

interface MetricsChartProps {
  title: string;
  metric: 'weight' | 'bodyFat' | 'muscleMass' | 'biceps' | 'chest' | 'waist' | 'hips' | 'thighs' | 'calves';
  unit: string;
  color: string;
  /** Altura del área del gráfico en px (por defecto 300). */
  height?: number;
  /** Menos padding en la tarjeta (vistas compactas). */
  compact?: boolean;
  className?: string;
  /**
   * `card` (default): envoltorio `brand-card` con estilo del tema.
   * `plain`: sin tarjeta interna; pensado para vivir dentro de un panel oscuro (p. ej. métricas destacadas).
   */
  variant?: 'card' | 'plain';
}

export function MetricsChart({
  title,
  metric,
  unit,
  color,
  height = 300,
  compact,
  className,
  variant = 'card',
}: MetricsChartProps) {
  const { getChartData } = useMetrics();
  const data = getChartData(metric);
  const emptyH = Math.max(160, Math.min(height, 280));
  const isPlain = variant === 'plain';

  const wrapClass = cn(
    isPlain ? 'space-y-3' : cn('brand-card rounded-2xl', compact ? 'p-4' : 'p-8'),
    className,
  );

  const titleClass = cn(
    'font-black uppercase tracking-tight',
    isPlain
      ? cn('mb-2', compact ? 'text-sm text-white/90' : 'text-base text-white/90 sm:text-lg')
      : compact
        ? 'mb-3 text-sm text-foreground'
        : 'mb-6 text-lg text-foreground',
  );

  const emptyInnerClass = cn(
    'flex items-center justify-center rounded-xl',
    isPlain
      ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02]'
      : 'bg-gradient-to-br from-primary/10 to-secondary/10',
  );

  const emptyTextClass = isPlain ? 'text-sm text-white/50' : 'text-muted-foreground text-sm';

  const gridStroke = isPlain ? 'rgba(255,255,255,0.08)' : 'var(--border)';
  const axisStroke = isPlain ? 'rgba(255,255,255,0.45)' : 'var(--muted-foreground)';
  const tooltipContentStyle = isPlain
    ? {
        backgroundColor: '#080a0d',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        color: '#fff',
      }
    : {
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--foreground)',
      };
  const tooltipLabelStyle = isPlain ? { color: 'rgba(255,255,255,0.55)' } : { color: 'var(--muted-foreground)' };

  if (data.length === 0) {
    return (
      <div className={wrapClass}>
        <h3 className={titleClass}>{title}</h3>
        <div className={emptyInnerClass} style={{ height: emptyH }}>
          <p className={emptyTextClass}>No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <h3 className={titleClass}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={isPlain ? 1 : 0.5} />
          <XAxis dataKey="date" stroke={axisStroke} style={{ fontSize: '12px' }} />
          <YAxis
            stroke={axisStroke}
            style={{ fontSize: '12px' }}
            label={{ value: unit, angle: -90, position: 'insideLeft', fill: isPlain ? 'rgba(255,255,255,0.45)' : undefined }}
          />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value: number | string, name: string, item: { payload?: { bodyFatSource?: string } }) => {
              if (metric === 'bodyFat' && item?.payload?.bodyFatSource === 'estimated') {
                return [`${value} ${unit} (est.)`, name];
              }
              return [`${value} ${unit}`, name];
            }}
          />
          <Legend wrapperStyle={isPlain ? { color: 'rgba(255,255,255,0.65)' } : undefined} />
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
