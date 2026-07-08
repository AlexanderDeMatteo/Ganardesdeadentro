'use client';

import Link from 'next/link';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/landing/brand-logo';

export function LandingFooterV4() {
  return (
    <footer className="relative border-t border-[var(--landing-green-dark)]/40 bg-black/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="landing-v4-divider absolute inset-x-0 top-0 mx-auto max-w-4xl" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-6">
          <p className="landing-heading max-w-xs text-2xl leading-tight text-[var(--landing-green)] lg:max-w-none">
            Proyecto Ganar desde Adentro
          </p>
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/55"
            aria-label="Pie de página"
          >
            <Link href="/register" className="transition-colors hover:text-[var(--landing-green)]">
              Privacidad
            </Link>
            <Link href="/register" className="transition-colors hover:text-[var(--landing-green)]">
              Términos
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-[var(--landing-green)]">
              Soporte
            </a>
            <span className="text-white/25" aria-hidden>
              |
            </span>
            <a
              href="https://instagram.com"
              className="transition-colors hover:text-[var(--landing-green)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Instagram
            </a>
            <a
              href="https://twitter.com"
              className="transition-colors hover:text-[var(--landing-green)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Twitter
            </a>
          </nav>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:text-right">
          © {new Date().getFullYear()} Proyecto Ganar desde Adentro · {BRAND_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
