import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type PrimeComingSoonProps = {
  title: string;
  legacyHref: string;
};

export function PrimeComingSoon({ title, legacyHref }: PrimeComingSoonProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="gp-label text-[#68ca62]">Próximamente</p>
      <h1 className="gp-display mt-2 text-3xl text-[#dce5de]">{title}</h1>
      <p className="gp-mono mt-3 max-w-md text-sm text-[#becab8]">
        Esta sección estará disponible en Gainer Prime. Usa el admin legacy mientras tanto.
      </p>
      <Link
        href={legacyHref}
        className="gp-mono mt-6 inline-flex items-center gap-2 rounded-full border border-[#68ca62]/50 px-4 py-2 text-sm text-[#68ca62] transition-colors hover:bg-[#68ca62]/10"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Ir a vista legacy
      </Link>
    </div>
  );
}
