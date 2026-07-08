import { describe, expect, it } from 'vitest';
import {
  ATHLETE_MOBILE_DOCK_HREFS,
  getPrimeMobileDockItems,
  getPrimeMobileOverflowItems,
} from '@/lib/admin-v2/prime-mobile-nav';
import { ATHLETE_NAV_ITEMS } from '@/lib/auth/role-routes';

describe('prime-mobile-nav', () => {
  it('picks four preferred athlete dock items when membership is active', () => {
    const dock = getPrimeMobileDockItems(ATHLETE_NAV_ITEMS, ATHLETE_MOBILE_DOCK_HREFS);
    expect(dock.map((item) => item.href)).toEqual([
      '/dashboard',
      '/routines',
      '/metrics',
      '/profile',
    ]);
  });

  it('returns overflow items not shown in the dock', () => {
    const dock = getPrimeMobileDockItems(ATHLETE_NAV_ITEMS, ATHLETE_MOBILE_DOCK_HREFS);
    const overflow = getPrimeMobileOverflowItems(ATHLETE_NAV_ITEMS, dock);
    expect(overflow.map((item) => item.href)).toEqual([
      '/nutrition',
      '/memberships',
      '/support',
    ]);
  });
});
