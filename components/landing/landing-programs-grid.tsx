'use client';

import { ServiceCard, type ServiceCardAccent, type ServiceCardProps } from '@/components/landing/service-card';
import type { LucideIcon } from 'lucide-react';

export type ProgramItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  accent: ServiceCardAccent;
  badge?: string;
};

type LandingProgramsGridProps = {
  programs: ProgramItem[];
  href: string;
};

export function LandingProgramsGrid({ programs, href }: LandingProgramsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {programs.map((plan) => (
        <ServiceCard key={plan.id} {...plan} href={href} />
      ))}
    </div>
  );
}

// Re-export for convenience
export type { ServiceCardProps };
