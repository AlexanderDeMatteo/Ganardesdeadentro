type PrimeProgressSegmentsProps = {
  value: number;
  segments?: number;
};

export function PrimeProgressSegments({ value, segments = 10 }: PrimeProgressSegmentsProps) {
  const filled = Math.round((value / 100) * segments);

  return (
    <div className="gp-progress-segments">
      {Array.from({ length: segments }, (_, index) => (
        <div
          key={index}
          className={`gp-progress-segment ${index < filled ? 'is-filled' : ''}`}
        />
      ))}
    </div>
  );
}
