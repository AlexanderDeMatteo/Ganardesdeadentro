'use client';

import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';

export function TrainerPrimeTopBar() {
  const { user } = useAuth();

  return (
    <header className="fixed right-0 top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#255831]/60 bg-[#0d1511]/80 px-4 backdrop-blur-md md:w-[calc(100%-280px)] md:px-10">
      <div className="flex min-w-0 items-center gap-4">
        <h2 className="gp-display gp-title-metallic hidden text-2xl lg:block">
          BE A GAINER LIFE
        </h2>
        <Link
          href="/trainer"
          className="gp-mono inline-flex items-center gap-2 rounded border border-[#3f4a3c] bg-[#19211d] px-3 py-1.5 text-xs uppercase text-[#becab8] transition-colors hover:border-[#68ca62]/50 hover:text-[#83e77b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Vista clásica
        </Link>
      </div>

      <div className="flex items-center gap-3 border-l border-[#3f4a3c] pl-4">
        <div className="hidden text-right sm:block">
          <p className="gp-label text-[#83e77b]">{user?.first_name ?? 'Entrenador'}</p>
          <p className="gp-mono text-[10px] uppercase text-[#becab8]">Panel entrenador</p>
        </div>
        <UserCircle className="h-8 w-8 text-[#becab8]" aria-hidden />
      </div>
    </header>
  );
}
