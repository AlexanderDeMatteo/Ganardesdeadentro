'use client';

import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, Search, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const publicNav = [
  { href: '/', label: 'Inicio' },
  { href: '/#comunidad', label: 'Comunidad' },
  { href: '/#progreso', label: 'Progreso' },
  { href: '/#rutinas', label: 'Rutinas' },
] as const;

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <motion.div className="inline-flex items-center gap-1" whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors md:text-[11px]',
          active ? 'text-[var(--landing-green)]' : 'text-white/70 hover:text-[var(--landing-green)]',
        )}
      >
        {label}
        <ChevronRight
          className={cn(
            'h-3 w-3 opacity-0 transition-opacity',
            !active && 'group-hover:opacity-60',
          )}
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}

export function LandingNavbar({ premium = false }: { premium?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  const authenticatedNav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/metrics', label: 'Progreso' },
    { href: '/routines', label: 'Rutinas' },
    { href: '/memberships', label: 'Membresías' },
  ] as const;

  const navItems = isAuthenticated ? authenticatedNav : publicNav;

  const closeMenu = () => setOpen(false);

  useGSAP(
    () => {
      const panel = panelRef.current;
      const links = mobileNavRef.current?.querySelectorAll('a, button');
      if (!panel) return;

      gsap.killTweensOf([panel, ...(links ? Array.from(links) : [])]);

      if (reducedMotion) {
        gsap.set(panel, {
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          display: open ? 'block' : 'none',
        });
        if (links) gsap.set(links, { opacity: 1, y: 0 });
        return;
      }

      if (open) {
        gsap.set(panel, { display: 'block', overflow: 'hidden' });
        gsap.fromTo(
          panel,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' },
        );
        if (links?.length) {
          gsap.fromTo(
            links,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.08 },
          );
        }
      } else {
        gsap.to(panel, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(panel, { display: 'none', overflow: 'hidden' });
          },
        });
      }
    },
    { dependencies: [open, reducedMotion], scope: panelRef },
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !mobileNavRef.current) return;
    const firstLink = mobileNavRef.current.querySelector<HTMLElement>('a, button');
    firstLink?.focus();
  }, [open]);

  return (
    <>
      <ExpirationAlert />
      <header
        className={cn(
          'relative sticky top-0 z-50 border-b backdrop-blur-xl',
          premium
            ? 'border-[var(--landing-green)]/25 bg-[color-mix(in_srgb,var(--landing-bg)_75%,transparent)] shadow-[0_8px_32px_rgb(0_0_0_/_0.45),0_1px_0_rgb(104_202_98_/_0.12)]'
            : 'border-[var(--landing-green-dark)]/40 bg-[color-mix(in_srgb,var(--landing-bg)_88%,transparent)] shadow-[0_8px_32px_rgb(0_0_0_/_0.45)]',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
            <Image
              src="/WhatsApp_Image_2026-06-03_at_7.42.29_PM__1_-removebg-preview.png"
              alt="BE A GAINER LIFE"
              width={40}
              height={40}
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
            <span className="landing-heading min-w-0 max-w-[7rem] text-left text-[10px] leading-tight tracking-[0.05em] text-[var(--landing-green)] sm:max-w-[10rem] sm:text-xs md:max-w-[14rem] md:text-sm lg:max-w-none lg:text-base">
              Proyecto Ganar desde Adentro
            </span>
          </Link>

          <nav
            className="group hidden items-center justify-center gap-8 md:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2"
            aria-label="Principal"
          >
            {navItems.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : !item.href.includes('#') && pathname === item.href;
              return (
                <NavLink key={item.href} href={item.href} label={item.label} active={active} />
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/register" className="hidden sm:block">
                  <Button
                    size="sm"
                    className={cn(
                      'h-9 rounded-none border border-[var(--landing-green-dark)] bg-[var(--landing-green)] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--landing-bg)] shadow-[4px_4px_0_0_var(--landing-green-dark)] hover:bg-[color-mix(in_srgb,var(--landing-green)_92%,white)]',
                      premium && 'hover:shadow-[var(--landing-glow-button)]',
                    )}
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
                  className="h-9 rounded-none border-[var(--landing-green-pastel)]/50 bg-transparent text-[11px] font-black uppercase tracking-[0.1em] text-[var(--landing-green-pastel)] hover:bg-[var(--landing-green)]/10"
                >
                  Panel
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/60 hover:text-[var(--landing-green)]"
                asChild
              >
                <Link href="/routines" aria-label="Buscar rutinas">
                  <Search className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/60 hover:text-[var(--landing-green)]"
                asChild
              >
                <Link
                  href={isAuthenticated ? '/profile' : '/login'}
                  aria-label={isAuthenticated ? 'Perfil' : 'Iniciar sesión'}
                >
                  {isAuthenticated && user?.first_name ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--landing-green)] to-[var(--landing-green-pastel)] text-[10px] font-black text-[var(--landing-bg)]">
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
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div
          id="landing-mobile-nav"
          ref={panelRef}
          className="overflow-hidden border-t border-[var(--landing-green-dark)]/40 bg-[var(--landing-bg)] md:hidden"
          style={{ height: 0, opacity: 0, display: 'none' }}
        >
          <nav ref={mobileNavRef} className="flex flex-col gap-3 px-4 py-4" aria-label="Móvil">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold uppercase tracking-[0.12em] text-white/90 hover:text-[var(--landing-green)]"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/register" onClick={closeMenu}>
                <Button className="mt-2 w-full rounded-none border border-[var(--landing-green-dark)] bg-[var(--landing-green)] font-black uppercase text-[var(--landing-bg)]">
                  Únete a la élite
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
