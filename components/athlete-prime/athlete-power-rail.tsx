'use client';

import type { RoleNavItem } from '@/lib/auth/role-routes';

const NAV_ITEM_HEIGHT = 40;
const NAV_ITEM_GAP = 4;
const NAV_PADDING_TOP = 0;

type AthletePowerRailProps = {
  activeHref: string;
  items: RoleNavItem[];
};

function getActiveIndex(pathname: string, items: RoleNavItem[]): number {
  const idx = items.findIndex((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return idx >= 0 ? idx : 0;
}

export function AthletePowerRail({ activeHref, items }: AthletePowerRailProps) {
  const activeIndex = getActiveIndex(activeHref, items);
  const top = NAV_PADDING_TOP + activeIndex * (NAV_ITEM_HEIGHT + NAV_ITEM_GAP);

  return (
    <div
      className="gp-power-rail-indicator"
      style={{
        top: `${top}px`,
        height: `${NAV_ITEM_HEIGHT}px`,
      }}
      aria-hidden
    />
  );
}
