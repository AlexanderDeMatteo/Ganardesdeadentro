import {
  Dumbbell,
  LayoutDashboard,
  Link2,
  Sparkles,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const TRAINER_V2_NAV_ICON_MAP: Record<string, LucideIcon> = {
  '/trainer-v2': LayoutDashboard,
  '/trainer-v2/athletes': Users,
  '/trainer-v2/routines': Dumbbell,
  '/trainer-v2/exercises': Sparkles,
  '/trainer-v2/assignments': Link2,
  '/trainer-v2/progress': TrendingUp,
  '/trainer-v2/profile': User,
};
