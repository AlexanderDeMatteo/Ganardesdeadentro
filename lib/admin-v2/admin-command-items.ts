import type { LucideIcon } from 'lucide-react';
import { ADMIN_V2_NAV_ITEMS } from '@/lib/auth/role-routes';
import { ADMIN_V2_NAV_ICON_MAP } from '@/lib/admin-v2/admin-v2-nav-icons';
import type { Athlete, Trainer } from '@/lib/data/types';
import { Link2, Sparkles, UserPlus, Users } from 'lucide-react';

export type AdminCommandGroup = 'navigation' | 'actions' | 'athletes' | 'trainers';

export type AdminCommandItem = {
  id: string;
  group: AdminCommandGroup;
  label: string;
  keywords: string;
  href: string;
  icon?: LucideIcon;
};

const ENTITY_RESULT_LIMIT = 8;

const ACTION_COMMANDS: AdminCommandItem[] = [
  {
    id: 'action-assignments',
    group: 'actions',
    label: 'Asignar atletas pendientes',
    keywords: 'asignar atletas pendientes cola operaciones',
    href: '/admin-v2/assignments',
    icon: Link2,
  },
  {
    id: 'action-invite-trainer',
    group: 'actions',
    label: 'Invitar entrenador',
    keywords: 'invitar entrenador nuevo crear',
    href: '/admin-v2/trainers',
    icon: UserPlus,
  },
  {
    id: 'action-exercises',
    group: 'actions',
    label: 'Gestionar ejercicios',
    keywords: 'ejercicios catálogo custom inventario',
    href: '/admin-v2/exercises',
    icon: Sparkles,
  },
  {
    id: 'action-memberships',
    group: 'actions',
    label: 'Ver membresías',
    keywords: 'membresías planes suscripciones',
    href: '/admin-v2/memberships',
    icon: ADMIN_V2_NAV_ICON_MAP['/admin-v2/memberships'],
  },
];

export function buildNavCommands(): AdminCommandItem[] {
  return ADMIN_V2_NAV_ITEMS.map((item) => ({
    id: `nav-${item.href}`,
    group: 'navigation' as const,
    label: item.label,
    keywords: `${item.label} navegación ir`,
    href: item.href,
    icon: ADMIN_V2_NAV_ICON_MAP[item.href],
  }));
}

export function buildActionCommands(): AdminCommandItem[] {
  return ACTION_COMMANDS;
}

function matchesQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function buildEntityCommands(
  athletes: Athlete[],
  trainers: Trainer[],
  query = '',
): AdminCommandItem[] {
  const athleteItems = athletes
    .filter((athlete) => matchesQuery(`${athlete.name} ${athlete.email}`, query))
    .slice(0, ENTITY_RESULT_LIMIT)
    .map((athlete) => ({
      id: `athlete-${athlete.id}`,
      group: 'athletes' as const,
      label: athlete.name,
      keywords: `${athlete.name} ${athlete.email} atleta`,
      href: `/admin-v2/athletes?athlete=${athlete.id}`,
      icon: Users,
    }));

  const trainerItems = trainers
    .filter((trainer) => matchesQuery(`${trainer.name} ${trainer.email}`, query))
    .slice(0, ENTITY_RESULT_LIMIT)
    .map((trainer) => ({
      id: `trainer-${trainer.id}`,
      group: 'trainers' as const,
      label: trainer.name,
      keywords: `${trainer.name} ${trainer.email} entrenador`,
      href: '/admin-v2/trainers',
      icon: ADMIN_V2_NAV_ICON_MAP['/admin-v2/trainers'],
    }));

  return [...athleteItems, ...trainerItems];
}

export function filterCommandsByQuery(
  commands: AdminCommandItem[],
  query: string,
): AdminCommandItem[] {
  if (!query.trim()) return commands;
  const normalized = query.trim().toLowerCase();
  return commands.filter(
    (command) =>
      command.label.toLowerCase().includes(normalized) ||
      command.keywords.toLowerCase().includes(normalized),
  );
}

export function buildAllCommands(
  athletes: Athlete[],
  trainers: Trainer[],
): AdminCommandItem[] {
  return [
    ...buildNavCommands(),
    ...buildActionCommands(),
    ...buildEntityCommands(athletes, trainers),
  ];
}
