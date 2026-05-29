'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Link as LinkIcon,
  TrendingUp,
  User,
} from 'lucide-react';

const navItems = [
  { href: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trainer/athletes', label: 'Mis atletas', icon: Users },
  { href: '/trainer/routines', label: 'Rutinas', icon: Dumbbell },
  { href: '/trainer/assignments', label: 'Asignaciones', icon: LinkIcon },
  { href: '/trainer/progress', label: 'Progreso', icon: TrendingUp },
  { href: '/trainer/profile', label: 'Perfil', icon: User },
];

export function TrainerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-primary/20 bg-sidebar/95 pt-20 shadow-[12px_0_36px_rgb(0_0_0_/_0.25)] backdrop-blur-xl">
      <nav className="space-y-2 px-4 py-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/trainer'
              ? pathname === '/trainer'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground brand-glow-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
