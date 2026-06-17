'use client';

import { Search } from 'lucide-react';

type PrimeSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function PrimeSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar',
}: PrimeSearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 gp-text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="gp-mono gp-search-terminal w-full py-2 pl-7 pr-2 text-sm gp-text-primary placeholder:gp-text-dim"
        aria-label={ariaLabel}
      />
    </div>
  );
}
