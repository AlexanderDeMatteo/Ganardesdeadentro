'use client';

import Link from 'next/link';
import { Menu, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { NotificationBell } from '@/components/notifications/notification-bell';

type AthletePrimeTopBarProps = {
  onOpenMobileNav?: () => void;
};

export function AthletePrimeTopBar({ onOpenMobileNav }: AthletePrimeTopBarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="fixed right-0 top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#255831]/60 bg-[#0d1511]/80 px-4 backdrop-blur-md md:w-[calc(100%-280px)] md:px-10">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md gp-text-muted transition-colors hover:gp-text-phosphor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62] md:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <h2 className="gp-display gp-title-metallic hidden text-2xl lg:block">
          BE A GAINER LIFE
        </h2>
        {isAdmin && (
          <Link
            href="/admin-v2"
            className="gp-mono inline-flex items-center gap-2 rounded border gp-border-outline gp-bg-surface px-3 py-1.5 text-xs uppercase gp-text-muted transition-colors hover:border-[#68ca62]/50 hover:gp-text-phosphor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
          >
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Panel admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell athleteMode />
        <Link
          href="/profile"
          className="flex items-center gap-3 border-l gp-border-outline pl-4 transition-opacity hover:opacity-90"
        >
        <div className="hidden text-right sm:block">
          <p className="gp-label gp-text-phosphor">{user?.first_name ?? 'Atleta'}</p>
          <p className="gp-mono text-[10px] uppercase gp-text-muted">Mi cuenta</p>
        </div>
        <UserCircle className="h-8 w-8 gp-text-muted" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
