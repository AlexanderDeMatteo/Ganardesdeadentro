import {
  Award,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Link2,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const ADMIN_V2_NAV_ICON_MAP: Record<string, LucideIcon> = {
  '/admin-v2': LayoutDashboard,
  '/admin-v2/athletes': Users,
  '/admin-v2/trainers': Award,
  '/admin-v2/routines': Dumbbell,
  '/admin-v2/exercises': Sparkles,
  '/admin-v2/assignments': Link2,
  '/admin-v2/memberships': CreditCard,
};
