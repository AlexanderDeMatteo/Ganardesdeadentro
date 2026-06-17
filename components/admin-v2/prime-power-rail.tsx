'use client';

import { ADMIN_V2_NAV_ITEMS } from '@/lib/auth/role-routes';

const NAV_ITEM_HEIGHT = 40;
const NAV_ITEM_GAP = 4;
const NAV_PADDING_TOP = 0;

type PrimePowerRailProps = {
  activeHref: string;
};

function getActiveIndex(pathname: string): number {
  const idx = ADMIN_V2_NAV_ITEMS.findIndex((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return idx >= 0 ? idx : 0;
}

export function PrimePowerRail({ activeHref }: PrimePowerRailProps) {
  const activeIndex = getActiveIndex(activeHref);
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
