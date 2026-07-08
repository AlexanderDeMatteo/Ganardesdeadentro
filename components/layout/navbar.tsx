'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ATHLETE_NAV_ITEMS, isAdminLegacyPath, isAdminPreviewPath, isAthletePrimePath, isTrainerPreviewPath, navItemActive } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';
import {
  Apple,
  BarChart3,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
  UserCircle,
} from 'lucide-react';

const ATHLETE_NAV_ICONS = {
  '/dashboard': LayoutDashboard,
  '/routines': Dumbbell,
  '/metrics': BarChart3,
  '/nutrition': Apple,
  '/memberships': CreditCard,
} as const;

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isTrainer = user?.role === 'trainer';
  const isAdminPanel = user?.role === 'admin' && isAdminLegacyPath(pathname);
  const hideNavbar = isAdminPreviewPath(pathname) || isTrainerPreviewPath(pathname) || isAthletePrimePath(pathname);
  const profileHref = isTrainer ? '/trainer-v2/profile' : '/profile';

  const mainNav = ATHLETE_NAV_ITEMS.map((item) => ({
    ...item,
    icon: ATHLETE_NAV_ICONS[item.href as keyof typeof ATHLETE_NAV_ICONS],
  }));

  const trainerNav = [{ href: '/trainer-v2', label: 'Panel Entrenador', icon: UserCircle }] as const;

  if (hideNavbar) {
    return null;
  }

  return (
    <>
      <ExpirationAlert />
      <nav className="sticky top-0 z-50 border-b border-primary/20 bg-background/85 shadow-[0_8px_32px_rgb(0_0_0_/_0.35)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {isAuthenticated && !isAdminPanel && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-secondary/50 bg-card/70 md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="size-5 text-foreground" aria-hidden />
                </Button>
                <SheetContent
                  side="left"
                  className="z-[100] flex w-[min(100%,20rem)] flex-col gap-0 border-r border-border p-0 sm:max-w-xs"
                >
                  <SheetHeader className="border-b border-border px-4 py-4 text-left pt-[max(1rem,env(safe-area-inset-top))]">
                    <SheetTitle className="font-black uppercase tracking-wider">Menú</SheetTitle>
                    <p className="text-xs font-medium text-muted-foreground">Be a Gainer</p>
                  </SheetHeader>
                  <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {(isTrainer ? trainerNav : mainNav).map(({ href, label, icon: Icon }) => {
                      const active = navItemActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex min-h-12 items-center gap-3 rounded-lg px-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors',
                            active
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
                          {label}
                        </Link>
                      );
                    })}
                    {user?.role === 'admin' && !isAdminPanel && (
                      <Link
                        href="/admin-v2"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex min-h-12 items-center gap-3 rounded-lg px-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors',
                          pathname.startsWith('/admin')
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        <Shield className="size-5 shrink-0 opacity-90" aria-hidden />
                        Admin
                      </Link>
                    )}
                    <Separator className="my-2" />
                    <Link
                      href={profileHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      <User className="size-5 shrink-0 opacity-90" aria-hidden />
                      Mi perfil
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-extrabold uppercase tracking-[0.12em] text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-5 shrink-0 opacity-90" aria-hidden />
                      Cerrar sesión
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            <Link href={isAdminPanel ? '/admin-v2' : '/'} className="group flex min-w-0 items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2 text-primary-foreground brand-glow-primary transition-transform group-hover:scale-105">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="brand-title hidden truncate text-xl font-black brand-text-gradient sm:inline">
                Be a Gainer
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6">
            {isAuthenticated ? (
              <>
                {!isAdminPanel && (
                  <div className="hidden items-center gap-5 md:flex lg:gap-6">
                    {isTrainer ? (
                      <Link
                        href="/trainer-v2"
                        className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                      >
                        Panel Entrenador
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/routines"
                          className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                        >
                          Rutinas
                        </Link>
                        <Link
                          href="/metrics"
                          className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                        >
                          Métricas
                        </Link>
                        <Link
                          href="/nutrition"
                          className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                        >
                          Nutrición
                        </Link>
                        <Link
                          href="/memberships"
                          className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                        >
                          Membresías
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            href="/admin-v2"
                            className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                          >
                            Admin
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 border-secondary/50 bg-card/70 text-foreground hover:bg-secondary/10"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-black text-primary-foreground">
                        {user?.first_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden text-xs font-extrabold uppercase tracking-[0.12em] sm:inline">
                        {user?.first_name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild className="cursor-pointer gap-2">
                      <Link href={profileHref} className="flex">
                        <User className="h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdminPanel && (
                      <DropdownMenuItem asChild className="cursor-pointer gap-2">
                        <Link href="/dashboard" className="flex">
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Vista atleta</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <div className="my-2 border-t border-border" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="hidden sm:inline-flex">Regístrate</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
