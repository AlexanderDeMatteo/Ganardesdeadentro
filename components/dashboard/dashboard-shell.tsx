'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  LineChart,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Plus,
  Activity,
  BarChart3,
  UserCircle,
  Rss,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
};

const sidebarNav: NavItem[] = [
  { href: '/dashboard-2', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard-2' },
  { href: '/routines', label: 'Rutinas', icon: Dumbbell },
  { href: '/metrics', label: 'Métricas', icon: LineChart },
  { href: '/', label: 'Comunidad', icon: Users },
  { href: '/profile', label: 'Ajustes', icon: Settings },
];

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = item.match ? item.match(pathname) : pathname === item.href;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'dm-label flex items-center gap-2 border-l-4 p-4 text-xs font-bold uppercase tracking-widest transition-all duration-200',
        active
          ? 'border-secondary bg-primary text-primary-foreground brightness-110'
          : 'border-transparent text-muted-foreground hover:translate-x-1 hover:bg-muted/60',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {item.label}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const firstName = user?.first_name ?? 'Atleta';

  return (
    <div className="dashboard-mock-halftone min-h-screen overflow-x-hidden bg-background text-foreground">
      <ExpirationAlert />
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col border-r-2 border-border bg-card/95 py-8 lg:flex">
        <div className="mb-10 px-6">
          <p className="dm-display text-2xl leading-none text-primary">Champion</p>
          <p className="dm-label mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Estado élite</p>
        </div>
        <nav className="flex flex-1 flex-col">
          {sidebarNav.slice(0, 3).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'dm-label flex items-center gap-2 border-l-4 p-4 text-xs font-bold uppercase tracking-widest transition-all duration-200',
                pathname.startsWith('/admin')
                  ? 'border-secondary bg-primary text-primary-foreground brightness-110'
                  : 'border-transparent text-muted-foreground hover:translate-x-1 hover:bg-muted/60',
              )}
            >
              <Shield className="size-5 shrink-0" />
              Admin
            </Link>
          )}
          {sidebarNav.slice(3).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="px-4">
          <Link
            href="/routines"
            className="dm-label dashboard-hard-shadow-cyan block w-full bg-primary py-3 text-center text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:scale-95"
          >
            Registrar entreno
          </Link>
        </div>
        <footer className="mt-6 border-t-2 border-border pt-4">
          <Link
            href="/dashboard"
            className="dm-label flex items-center gap-2 p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <LayoutDashboard className="size-5" />
            Dashboard clásico
          </Link>
          <Link
            href="/"
            className="dm-label flex items-center gap-2 p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <HelpCircle className="size-5" />
            Ayuda
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="dm-label flex w-full items-center gap-2 p-4 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="size-5" />
            Cerrar sesión
          </button>
        </footer>
      </aside>

      <div className="min-h-screen lg:ml-64">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between border-b-2 border-border bg-background/95 px-6 backdrop-blur-sm lg:hidden">
          <span className="dm-display text-xl tracking-tight text-primary">FitTrack</span>
          <div className="flex items-center gap-4">
            <Bell className="size-6 text-primary" aria-hidden />
            <div className="flex size-8 items-center justify-center overflow-hidden border-2 border-primary bg-primary text-xs font-black text-primary-foreground">
              {user?.first_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        <main className="min-h-screen pb-28 pt-24 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t-2 border-primary bg-card/95 py-2 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.5)] backdrop-blur-sm lg:hidden">
        <Link
          href="/dashboard-2"
          className={cn(
            'flex flex-col items-center p-2 transition-transform',
            pathname === '/dashboard-2' ? 'scale-110 text-primary' : 'text-muted-foreground',
          )}
        >
          <Rss className="size-6" />
          <span className="dm-label text-[10px] font-medium uppercase">Inicio</span>
        </Link>
        <Link
          href="/routines"
          className={cn(
            'flex flex-col items-center p-2 text-muted-foreground transition-colors hover:text-secondary',
            pathname.startsWith('/routines') && 'text-secondary',
          )}
        >
          <Activity className="size-6" />
          <span className="dm-label text-[10px] font-medium uppercase">Train</span>
        </Link>
        <Link
          href="/metrics"
          className={cn(
            'flex flex-col items-center p-2 text-muted-foreground transition-colors hover:text-secondary',
            pathname.startsWith('/metrics') && 'text-secondary',
          )}
        >
          <BarChart3 className="size-6" />
          <span className="dm-label text-[10px] font-medium uppercase">Stats</span>
        </Link>
        <Link
          href="/profile"
          className={cn(
            'flex flex-col items-center p-2 text-muted-foreground transition-colors hover:text-secondary',
            pathname.startsWith('/profile') && 'text-secondary',
          )}
        >
          <UserCircle className="size-6" />
          <span className="dm-label text-[10px] font-medium uppercase">Perfil</span>
        </Link>
      </nav>

      <Link
        href="/routines"
        className="fixed bottom-24 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--brand-cyan)] transition-transform active:scale-95 lg:bottom-10 lg:right-10"
        aria-label="Añadir entrenamiento"
      >
        <Plus className="size-7 stroke-[2.5]" />
      </Link>

      <span className="sr-only" aria-live="polite">
        Sesión: {firstName}
      </span>
    </div>
  );
}
