'use client';

import { usePathname } from 'next/navigation';
import { PrimeSidebarNav } from '@/components/admin-v2/prime-sidebar-nav';

export function PrimeSidebar() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      aria-label="Navegación admin"
      className="gp-sidebar-gradient fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col overflow-hidden border-r border-[#3f4a3c] py-5 md:flex"
    >
      <PrimeSidebarNav activeHref={pathname} />
    </nav>
  );
}
