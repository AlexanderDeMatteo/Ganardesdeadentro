'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { isNavItemActive, type RoleNavItem } from '@/lib/auth/role-routes';

type RolePanelShellProps = {
  navItems: RoleNavItem[];
  iconMap: Record<string, LucideIcon>;
  children: React.ReactNode;
  mainClassName?: string;
};

function SidebarNavLink({
  item,
  pathname,
  Icon,
}: {
  item: RoleNavItem;
  pathname: string;
  Icon: LucideIcon;
}) {
  const isActive = isNavItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground brand-glow-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-primary',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

export function RolePanelShell({
  navItems,
  iconMap,
  children,
  mainClassName,
}: RolePanelShellProps) {
  const pathname = usePathname() ?? '';
  const mobileNavItems = navItems.slice(0, 4);

  return (
    <>
      <Navbar />
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-primary/20 bg-sidebar/95 pt-20 shadow-[12px_0_36px_rgb(0_0_0_/_0.25)] backdrop-blur-xl lg:flex">
        <nav className="flex flex-1 flex-col space-y-2 overflow-y-auto px-4 py-8">
          {navItems.map((item) => {
            const Icon = iconMap[item.href];
            if (!Icon) return null;
            return (
              <SidebarNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                Icon={Icon}
              />
            );
          })}
        </nav>
      </aside>

      <div className="min-h-screen lg:ml-64">
        <main
          id="main-content"
          className={cn(
            'brand-shell min-h-screen pb-28 pt-4 lg:pb-10 lg:pt-0',
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-primary/20 bg-card/95 py-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:hidden"
        aria-label="Navegación principal"
      >
        {mobileNavItems.map((item) => {
          const Icon = iconMap[item.href];
          if (!Icon) return null;
          const isActive = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 p-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate text-[9px] font-bold uppercase tracking-wide">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
