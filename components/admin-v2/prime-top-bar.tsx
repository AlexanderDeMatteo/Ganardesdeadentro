'use client';

import { Bell, History, UserCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { PrimeActivityLogPanel } from '@/components/admin-v2/prime-activity-log-panel';
import { PrimeAlertsPanel } from '@/components/admin-v2/prime-alerts-panel';
import { PrimeCommandPalette } from '@/components/admin-v2/prime-command-palette';
import { PrimeCommandTrigger } from '@/components/admin-v2/prime-command-trigger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminOpsFeed } from '@/hooks/use-admin-ops-feed';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { cn } from '@/lib/utils';

export function PrimeTopBar() {
  const { user } = useAuth();
  const { alerts, activityLog, badgeCount, markAlertsRead } = useAdminOpsFeed();
  const { open, setOpen } = useCommandPalette();

  const hasNonCriticalUnread = alerts.some(
    (a) => a.severity !== 'critical',
  );

  return (
    <>
      <header className="fixed right-0 top-0 z-50 flex h-20 w-full items-center justify-between border-b border-[#255831]/60 bg-[#0d1511]/80 px-4 backdrop-blur-md md:w-[calc(100%-280px)] md:px-10">
        <div className="flex min-w-0 items-center gap-6">
          <h2 className="gp-display gp-title-metallic hidden text-2xl lg:block">
            BE A GAINER LIFE
          </h2>
          <PrimeCommandTrigger open={open} onOpen={() => setOpen(true)} />
        </div>

        <div className="flex items-center gap-4 md:gap-6">
        <DropdownMenu onOpenChange={(open) => open && markAlertsRead()}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative text-[#becab8] transition-colors hover:text-[#95fa8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
              aria-label={
                badgeCount > 0
                  ? `Notificaciones, ${badgeCount} pendientes`
                  : 'Notificaciones'
              }
            >
              <Bell className="h-5 w-5" />
              {badgeCount > 0 ? (
                <span className="gp-mono absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffb4ab] px-1 text-[9px] font-bold text-[#2a1515]">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className={cn(
              'border-0 bg-transparent p-0 shadow-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
            )}
          >
            <PrimeAlertsPanel
              alerts={alerts}
              onMarkNonCriticalRead={markAlertsRead}
              hasNonCriticalUnread={hasNonCriticalUnread}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-[#becab8] transition-colors hover:text-[#95fa8b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
              aria-label="Historial de operaciones"
            >
              <History className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="border-0 bg-transparent p-0 shadow-none"
          >
            <PrimeActivityLogPanel items={activityLog} />
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3 border-l border-[#3f4a3c] pl-4">
          <div className="hidden text-right sm:block">
            <p className="gp-label text-[#83e77b]">{user?.first_name ?? 'Admin'}</p>
            <p className="gp-mono text-[10px] uppercase text-[#becab8]">System Ops</p>
          </div>
          <UserCircle className="h-8 w-8 text-[#becab8]" aria-hidden />
        </div>
      </div>
    </header>

      <PrimeCommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
