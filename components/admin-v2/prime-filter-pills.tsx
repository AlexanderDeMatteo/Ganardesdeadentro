import { cn } from '@/lib/utils';

type FilterOption<T extends string> = {
  key: T;
  label: string;
};

type PrimeFilterPillsProps<T extends string> = {
  filters: FilterOption<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function PrimeFilterPills<T extends string>({
  filters,
  active,
  onChange,
}: PrimeFilterPillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={cn(
            'gp-mono rounded-full border px-4 py-1.5 text-xs uppercase transition-colors',
            active === f.key
              ? 'border-[#68ca62] bg-[#68ca62]/15 text-[#83e77b]'
              : 'border-[#3f4a3c] bg-[#19211d] text-[#becab8] hover:border-[#68ca62]/50 hover:text-[#83e77b]',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
