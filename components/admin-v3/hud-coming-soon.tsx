import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type HudComingSoonProps = {
  title: string;
  legacyHref: string;
};

export function HudComingSoon({ title, legacyHref }: HudComingSoonProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-[11px] uppercase tracking-widest text-[#68ca62]">[ PRÓXIMAMENTE ]</p>
      <h1 className="mt-2 text-2xl uppercase tracking-wide text-[#dce5de]">{title}</h1>
      <p className="mt-3 max-w-md text-xs text-[#8fa88a]">
        Módulo en desarrollo para COMANDO LIFE HUD.
      </p>
      <Link
        href={legacyHref}
        className="mt-6 inline-flex items-center gap-2 border border-[#68ca62]/40 px-4 py-2 text-xs uppercase text-[#68ca62] transition-colors hover:bg-[#68ca62]/10"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Vista legacy
      </Link>
    </div>
  );
}
