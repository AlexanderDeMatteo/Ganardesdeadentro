'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

function notificationHref(type: string, data: Record<string, unknown>): string | null {
  if (type === 'payment.approved' || type === 'payment.rejected' || type === 'payment.submitted') {
    return '/admin-v2/payments';
  }
  if (type === 'support.message' || type === 'support.reply') {
    const athleteId = data.athleteId;
    if (typeof athleteId === 'string' && athleteId) {
      return `/admin-v2/support?athlete=${encodeURIComponent(athleteId)}`;
    }
    return '/admin-v2/support';
  }
  return null;
}

type NotificationBellProps = {
  className?: string;
  athleteMode?: boolean;
};

export function NotificationBell({ className, athleteMode = false }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]',
            athleteMode
              ? 'gp-text-muted hover:gp-text-phosphor'
              : 'text-[#becab8] hover:text-[#95fa8b]',
            className,
          )}
          aria-label={
            unreadCount > 0
              ? `Notificaciones, ${unreadCount} pendientes`
              : 'Notificaciones'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="gp-mono absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffb4ab] px-1 text-[9px] font-bold text-[#2a1515]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 border gp-border-outline bg-[#0d1511] p-0 text-[#e8f0e4]"
      >
        <div className="flex items-center justify-between border-b gp-border-outline px-4 py-3">
          <DropdownMenuLabel className="p-0 text-sm font-bold text-[#83e77b]">
            Notificaciones
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="gp-mono text-[10px] uppercase text-[#becab8] hover:text-[#95fa8b]"
            >
              Marcar todas
            </button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#becab8]">
              No hay notificaciones todavía.
            </p>
          ) : (
            notifications.slice(0, 20).map((item) => {
              const href = athleteMode
                ? item.type.startsWith('support')
                  ? '/support'
                  : item.type.startsWith('payment')
                    ? '/memberships'
                    : null
                : notificationHref(item.type, item.data);
              const content = (
                <div
                  className={cn(
                    'px-4 py-3',
                    !item.readAt && 'bg-[#1a2a20]/60',
                  )}
                >
                  <p className="text-sm font-semibold text-[#e8f0e4]">{item.title}</p>
                  {item.body ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[#becab8]">{item.body}</p>
                  ) : null}
                  <p className="gp-mono mt-2 text-[10px] uppercase text-[#7f8f7a]">
                    {new Date(item.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              );

              if (href) {
                return (
                  <DropdownMenuItem
                    key={item.id}
                    asChild
                    className="cursor-pointer rounded-none p-0 focus:bg-[#1f2d24]"
                    onClick={() => {
                      if (!item.readAt) void markRead(item.id);
                    }}
                  >
                    <Link href={href}>{content}</Link>
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer rounded-none p-0 focus:bg-[#1f2d24]"
                  onClick={() => {
                    if (!item.readAt) void markRead(item.id);
                  }}
                >
                  {content}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="bg-[#3f4a3c]" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
