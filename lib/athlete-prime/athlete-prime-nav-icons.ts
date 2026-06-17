import {
  Apple,
  BarChart3,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  User,
  type LucideIcon,
} from 'lucide-react';

export const ATHLETE_PRIME_NAV_ICON_MAP: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/routines': Dumbbell,
  '/metrics': BarChart3,
  '/nutrition': Apple,
  '/memberships': CreditCard,
  '/profile': User,
};
