'use client';

type PrimeSegmentRingProps = {
  value: number;
  segments?: number;
  size?: number;
  className?: string;
  criticalTint?: boolean;
};

export function PrimeSegmentRing({
  value,
  segments = 16,
  size = 160,
  className,
  criticalTint = false,
}: PrimeSegmentRingProps) {
  const filled = Math.round((value / 100) * segments);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.32;
  const gap = 0.08;

  const segmentPaths = Array.from({ length: segments }, (_, i) => {
    const startAngle = (i / segments) * 2 * Math.PI - Math.PI / 2 + gap / 2;
    const endAngle = ((i + 1) / segments) * 2 * Math.PI - Math.PI / 2 - gap / 2;
    const isFilled = i < filled;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);

    const d = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 0 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 0 0 ${x2i} ${y2i} Z`;

    return (
      <path
        key={i}
        d={d}
        fill={isFilled ? (criticalTint ? '#ffb4ab' : '#68ca62') : '#255831'}
        style={
          isFilled
            ? {
                filter: criticalTint
                  ? 'drop-shadow(0 0 6px rgba(255,180,171,0.6))'
                  : 'drop-shadow(0 0 6px rgba(104,202,98,0.55))',
              }
            : undefined
        }
        className="transition-all duration-500"
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden
    >
      {segmentPaths}
    </svg>
  );
}
