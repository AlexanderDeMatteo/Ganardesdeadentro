import type { MembershipLevel } from '@/lib/data/types';
import { cn } from '@/lib/utils';

type PrimeMembershipBadgeProps = {
  level: MembershipLevel;
  className?: string;
};

const LEVEL_STYLES: Record<MembershipLevel, string> = {
  pro: 'border-[var(--gp-phosphor)]/40 bg-[var(--gp-phosphor)]/15 gp-text-phosphor',
  premium: 'border-[var(--gp-secondary-fixed)]/30 bg-[var(--gp-secondary-fixed)]/10 text-[var(--gp-secondary-fixed)]',
  basic: 'gp-border-outline gp-bg-surface-variant gp-text-muted',
};

export function PrimeMembershipBadge({ level, className }: PrimeMembershipBadgeProps) {
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      className={cn(
        'gp-mono inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize',
        LEVEL_STYLES[level],
        className,
      )}
    >
      {label}
    </span>
  );
}
