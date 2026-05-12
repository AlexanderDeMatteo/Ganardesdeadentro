'use client';

import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, User, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const publicNav = [
  { href: '/', label: 'Inicio' },
  { href: '/#comunidad', label: 'Comunidad' },
  { href: '/#progreso', label: 'Progreso' },
  { href: '/#rutinas', label: 'Rutinas' },
] as const;

export function LandingNavbar() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const authenticatedNav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/metrics', label: 'Progreso' },
    { href: '/routines', label: 'Rutinas' },
    { href: '/memberships', label: 'Membresías' },
  ] as const;

  const navItems = isAuthenticated ? authenticatedNav : publicNav;

  return (
    <>
      <ExpirationAlert />
      <header className="relative sticky top-0 z-50 border-b border-white/10 bg-[color-mix(in_srgb,var(--brand-ink)_88%,transparent)] shadow-[0_8px_32px_rgb(0_0_0_/_0.45)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="landing-heading min-w-0 max-w-[9.5rem] shrink text-left text-[10px] leading-tight tracking-[0.05em] text-[var(--brand-lime)] sm:max-w-[12rem] sm:text-xs md:max-w-[16rem] md:text-sm lg:max-w-none lg:text-base"
        >
          Proyecto Ganar desde Adentro
        </Link>

        <nav
          className="hidden items-center justify-center gap-8 md:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          aria-label="Principal"
        >
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : !item.href.includes('#') && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors',
                  active ? 'text-[var(--brand-lime)]' : 'text-white/70 hover:text-[var(--brand-lime)]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <>
              <Link href="/register" className="hidden sm:block">
                <Button
                  size="sm"
                  className="h-9 rounded-none px-4 text-[11px] font-black uppercase tracking-[0.12em] shadow-[4px_4px_0_0_var(--brand-cyan)]"
                >
                  Únete a la élite
                </Button>
              </Link>
              <div className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden />
            </>
          ) : (
            <Link href="/dashboard" className="hidden sm:block">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-none border-[var(--brand-cyan)]/50 bg-transparent text-[11px] font-black uppercase tracking-[0.1em] text-[var(--brand-cyan)] hover:bg-[var(--brand-cyan)]/10"
              >
                Panel
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:text-[var(--brand-lime)]" asChild>
              <Link href="/routines" aria-label="Buscar rutinas">
                <Search className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:text-[var(--brand-lime)]" asChild>
              <Link href={isAuthenticated ? '/profile' : '/login'} aria-label={isAuthenticated ? 'Perfil' : 'Iniciar sesión'}>
                {isAuthenticated && user?.first_name ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-lime)] to-[var(--brand-cyan)] text-[10px] font-black text-[var(--brand-ink)]">
                    {user.first_name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div id="landing-mobile-nav" className="border-t border-white/10 bg-[var(--brand-ink)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Móvil">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold uppercase tracking-[0.12em] text-white/90"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="mt-2 w-full rounded-none font-black uppercase">Únete a la élite</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
