'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type PrimeCommandTriggerProps = {
  onOpen: () => void;
  open?: boolean;
  className?: string;
};

export function PrimeCommandTrigger({ onOpen, open = false, className }: PrimeCommandTriggerProps) {
  return (
    <div className={cn('relative hidden w-56 sm:block', className)}>
      <Search
        className="pointer-events-none absolute left-0 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#becab8]"
        aria-hidden
      />
      <input
        readOnly
        type="search"
        value=""
        onClick={onOpen}
        onFocus={(event) => {
          onOpen();
          event.currentTarget.blur();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab') return;
          event.preventDefault();
          onOpen();
        }}
        placeholder="Buscar comando..."
        className="gp-mono gp-search-terminal w-full cursor-pointer py-2 pl-7 pr-16 text-sm text-[#dce5de] placeholder:text-[#899483] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir paleta de comandos"
      />
      <kbd className="gp-mono pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 rounded border border-[#3f4a3c] bg-[#242c27] px-1.5 py-0.5 text-[10px] uppercase text-[#becab8] md:inline">
        Ctrl+K
      </kbd>
    </div>
  );
}
