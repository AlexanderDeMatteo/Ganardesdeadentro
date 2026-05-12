'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Dumbbell, FileText, Link as LinkIcon, CreditCard } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/athletes', label: 'Atletas', icon: Users },
  { href: '/admin/trainers', label: 'Entrenadores', icon: Users },
  { href: '/admin/routines', label: 'Rutinas', icon: Dumbbell },
  { href: '/admin/assignments', label: 'Asignaciones', icon: LinkIcon },
  { href: '/admin/memberships', label: 'Membresías', icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-primary/20 bg-sidebar/95 pt-20 shadow-[12px_0_36px_rgb(0_0_0_/_0.25)] backdrop-blur-xl">
      <nav className="space-y-2 px-4 py-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

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
