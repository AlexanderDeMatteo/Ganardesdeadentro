'use client';

import { useAuth } from '@/app/context/auth-context';
import { ExpirationAlert } from '@/components/membership/expiration-alert';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dumbbell, LogOut, User, Settings } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <ExpirationAlert />
      <nav className="sticky top-0 z-50 border-b border-primary/20 bg-background/85 shadow-[0_8px_32px_rgb(0_0_0_/_0.35)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2 text-primary-foreground brand-glow-primary transition-transform group-hover:scale-105">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="brand-title text-xl font-black brand-text-gradient hidden sm:inline">
            FitTrack
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/routines" className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary transition-colors">
                  Rutinas
                </Link>
                <Link href="/memberships" className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary transition-colors">
                  Membresías
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-secondary/50 bg-card/70 text-foreground hover:bg-secondary/10"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-black text-primary-foreground">
                      {user?.first_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-xs font-extrabold uppercase tracking-[0.12em]">{user?.first_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/profile" className="flex">
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link href="/settings" className="flex">
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <div className="my-2 border-t border-border" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
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
                <Button className="hidden sm:inline-flex">
                  Regístrate
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
