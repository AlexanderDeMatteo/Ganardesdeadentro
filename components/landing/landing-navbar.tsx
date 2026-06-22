'use client';

import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { BrandMark } from '@/components/landing/brand-mark';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const publicNav = [
  { href: '/', label: 'Inicio' },
  { href: '/#comunidad', label: 'Comunidad' },
  { href: '/#progreso', label: 'Progreso' },
  { href: '/#membresias', label: 'Membresías' },
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
    <motion.div
      className="relative inline-flex flex-col items-center gap-0"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'inline-flex items-center pb-0.5 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-200 md:text-[11px]',
          active
            ? 'text-[var(--landing-green)]'
            : 'text-white/60 hover:text-white',
        )}
      >
        {label}
      </Link>
      {/* Indicador underline animado con layoutId */}
      {active && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute -bottom-1 h-px w-full bg-[var(--landing-green)]"
          style={{ boxShadow: '0 0 8px rgb(104 202 98 / 0.7)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </motion.div>
  );
}

export function LandingNavbar({ premium = false }: { premium?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 24);
  });

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
      <motion.header
        initial={reducedMotion ? false : { y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative sticky top-0 z-50 border-b transition-all duration-300',
          scrolled
            ? 'backdrop-blur-2xl'
            : 'backdrop-blur-xl',
          premium
            ? 'border-[var(--landing-green)]/25 bg-[color-mix(in_srgb,var(--landing-bg)_75%,transparent)]'
            : 'border-[var(--landing-green-dark)]/40 bg-[color-mix(in_srgb,var(--landing-bg)_88%,transparent)]',
          scrolled
            ? 'shadow-[0_8px_40px_rgb(0_0_0_/_0.6),0_1px_0_rgb(104_202_98_/_0.1)]'
            : 'shadow-[0_4px_16px_rgb(0_0_0_/_0.3)]',
        )}
      >
        <div
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8',
            'transition-[padding] duration-300',
            scrolled ? 'py-2' : 'py-3',
          )}
        >
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            <Link
              href="/"
              aria-label="BE A GAINER LIFE — Proyecto Ganar desde Adentro"
              className="flex min-w-0 shrink items-center gap-2.5"
            >
              <BrandMark
                className={cn(
                  'transition-all duration-300',
                  scrolled ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10',
                )}
              />
              <div className="flex min-w-0 flex-col text-left leading-tight">
                <span className="landing-heading text-[10px] leading-none text-[var(--landing-green)] sm:text-[11px]">
                  BE A GAINER
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--landing-green-pastel)] sm:text-[9px]">
                  LIFE
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Nav desktop */}
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
                <NavLink key={item.href} href={item.href} label={item.label} active={active} />
              );
            })}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/register" className="hidden sm:block">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      size="sm"
                      className={cn(
                        'h-9 rounded-none border border-[var(--landing-green-dark)] bg-[var(--landing-green)] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--landing-bg)]',
                        'transition-shadow duration-300',
                        'shadow-[3px_3px_0_0_var(--landing-green-dark)]',
                        'hover:shadow-[var(--landing-glow-button)] hover:bg-[color-mix(in_srgb,var(--landing-green)_92%,white)]',
                      )}
                    >
                      Únete a la élite
                    </Button>
                  </motion.div>
                </Link>
                <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
              </>
            ) : (
              <Link href="/dashboard" className="hidden sm:block">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-none border-[var(--landing-green-pastel)]/40 bg-transparent text-[11px] font-black uppercase tracking-[0.1em] text-[var(--landing-green-pastel)] transition-colors hover:bg-[var(--landing-green)]/10 hover:border-[var(--landing-green-pastel)]/70"
                >
                  Panel
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/50 transition-colors hover:bg-[var(--landing-green)]/8 hover:text-[var(--landing-green)]"
                asChild
              >
                <Link href="/routines" aria-label="Buscar rutinas">
                  <Search className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/50 transition-colors hover:bg-[var(--landing-green)]/8 hover:text-[var(--landing-green)]"
                asChild
              >
                <Link
                  href={isAuthenticated ? '/profile' : '/login'}
                  aria-label={isAuthenticated ? 'Perfil' : 'Iniciar sesión'}
                >
                  {isAuthenticated && user?.first_name ? (
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.15 }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--landing-green)] to-[var(--landing-green-pastel)] text-[10px] font-black text-[var(--landing-bg)] shadow-[0_0_12px_rgb(104_202_98_/_0.35)]"
                    >
                      {user.first_name.charAt(0).toUpperCase()}
                    </motion.span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Link>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/70 transition-colors hover:text-white md:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              <motion.div
                animate={open ? { rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Menú mobile */}
        <div
          id="landing-mobile-nav"
          ref={panelRef}
          className="overflow-hidden border-t border-[var(--landing-green-dark)]/30 bg-[var(--landing-bg)] md:hidden"
          style={{ height: 0, opacity: 0, display: 'none' }}
        >
          <nav ref={mobileNavRef} className="flex flex-col px-4 py-3" aria-label="Móvil">
            {navItems.map((item, i) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : !item.href.includes('#') && pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between border-b border-white/5 py-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors',
                    active
                      ? 'text-[var(--landing-green)]'
                      : 'text-white/75 hover:text-white',
                    i === navItems.length - 1 && 'border-b-0',
                  )}
                  onClick={closeMenu}
                >
                  {item.label}
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-green)]" style={{ boxShadow: '0 0 6px rgb(104 202 98 / 0.8)' }} />
                  )}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <Link href="/register" onClick={closeMenu} className="mt-3">
                <Button className="w-full rounded-none border border-[var(--landing-green-dark)] bg-[var(--landing-green)] font-black uppercase text-[var(--landing-bg)] shadow-[0_0_20px_rgb(104_202_98_/_0.2)] hover:shadow-[0_0_28px_rgb(104_202_98_/_0.35)]">
                  Únete a la élite
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </motion.header>
    </>
  );
}
