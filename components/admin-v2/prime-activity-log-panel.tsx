'use client';

import { memo, useMemo, useState } from 'react';
import type { AdminActivityCategory, AdminActivityItem } from '@/lib/admin-v2/admin-ops-feed';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { cn } from '@/lib/utils';

type ActivityFilter = 'all' | 'activity' | 'operations';

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'activity', label: 'Actividad' },
  { key: 'operations', label: 'Operaciones' },
];

type PrimeActivityLogPanelProps = {
  items: AdminActivityItem[];
};

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function matchesFilter(item: AdminActivityItem, filter: ActivityFilter) {
  if (filter === 'all') return true;
  if (filter === 'activity') {
    return item.category === 'activity' || item.category === 'telemetry';
  }
  return item.category === 'operations';
}

export const PrimeActivityLogPanel = memo(function PrimeActivityLogPanel({
  items,
}: PrimeActivityLogPanelProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const visible = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  return (
    <div className="gainer-prime-root w-[min(100vw-2rem,360px)]">
      <div className="gp-module gp-module-corner overflow-hidden border border-[#3f4a3c] bg-[#19211d] shadow-2xl">
        <header className="gp-module-header space-y-3 border-b border-[#3f4a3c]/50 px-4 py-3">
          <p className="gp-module-id">
            <strong>MOD-67</strong>
            {' // '}
            BITÁCORA_OPS
          </p>
          <PrimeFilterPills filters={FILTERS} active={filter} onChange={setFilter} />
        </header>

        <div className="gp-scroll-thin max-h-[min(60dvh,24rem)] overflow-y-auto p-3">
          {visible.length > 0 ? (
            <ul className="space-y-2">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className="border-l-2 border-[#68ca62]/40 py-1 pl-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="gp-mono text-xs text-[#dce5de]">{item.message}</p>
                    <span className="gp-mono shrink-0 text-[10px] text-[#899483]">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'gp-mono mt-1 inline-block text-[9px] uppercase',
                      item.isStateSnapshot ? 'text-[#f2b84b]' : 'text-[#899483]',
                    )}
                  >
                    {item.isStateSnapshot ? 'Estado actual' : categoryLabel(item.category)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="gp-mono py-8 text-center text-sm text-[#becab8]">Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
});

function categoryLabel(category: AdminActivityCategory) {
  if (category === 'telemetry') return 'Telemetría';
  if (category === 'operations') return 'Operaciones';
  return 'Actividad';
}
