'use client';

import { memo } from 'react';
import Link from 'next/link';
import type { AdminAlert } from '@/lib/admin-v2/admin-ops-feed';
import { cn } from '@/lib/utils';
import { Mail } from 'lucide-react';

type PrimeAlertsPanelProps = {
  alerts: AdminAlert[];
  onMarkNonCriticalRead?: () => void;
  hasNonCriticalUnread?: boolean;
};

function severityStyles(severity: AdminAlert['severity']) {
  if (severity === 'critical') {
    return {
      badge: 'border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]',
      border: 'border-[#ffb4ab]/25',
    };
  }
  if (severity === 'warning') {
    return {
      badge: 'border-[#f2b84b]/30 bg-[#f2b84b]/10 text-[#f2b84b]',
      border: 'border-[#f2b84b]/25',
    };
  }
  return {
    badge: 'border-[#68ca62]/30 bg-[#68ca62]/10 text-[#83e77b]',
    border: 'border-[#3f4a3c]',
  };
}

function severityLabel(severity: AdminAlert['severity']) {
  if (severity === 'critical') return 'CRÍTICA';
  if (severity === 'warning') return 'AVISO';
  return 'INFO';
}

export const PrimeAlertsPanel = memo(function PrimeAlertsPanel({
  alerts,
  onMarkNonCriticalRead,
  hasNonCriticalUnread,
}: PrimeAlertsPanelProps) {
  return (
    <div className="gainer-prime-root w-[min(100vw-2rem,360px)]">
      <div className="gp-module gp-module-corner overflow-hidden border border-[#3f4a3c] bg-[#19211d] shadow-2xl">
        <header className="gp-module-header border-b border-[#3f4a3c]/50 px-4 py-3">
          <p className="gp-module-id">
            <strong>MOD-66</strong>
            {' // '}
            ALERTAS_SISTEMA
          </p>
          {hasNonCriticalUnread && onMarkNonCriticalRead ? (
            <button
              type="button"
              onClick={onMarkNonCriticalRead}
              className="gp-mono mt-2 text-[10px] uppercase text-[#83e77b] hover:underline"
            >
              Marcar avisos como leídos
            </button>
          ) : null}
        </header>

        <div className="gp-scroll-thin max-h-[min(60dvh,24rem)] overflow-y-auto p-3">
          {alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.map((alert) => {
                const styles = severityStyles(alert.severity);
                return (
                  <li
                    key={alert.id}
                    className={cn(
                      'rounded-md border bg-[#242c27]/60 px-3 py-2.5',
                      styles.border,
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="gp-mono text-xs font-medium text-[#dce5de]">{alert.title}</span>
                      <span
                        className={cn(
                          'gp-metric rounded-full border px-2 py-0.5 text-[9px] uppercase',
                          styles.badge,
                        )}
                      >
                        {severityLabel(alert.severity)}
                      </span>
                    </div>
                    <p className="gp-mono text-[11px] text-[#899483]">{alert.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {alert.href ? (
                        <Link
                          href={alert.href}
                          className="gp-mono text-[10px] uppercase text-[#83e77b] hover:underline"
                        >
                          Ver detalle
                        </Link>
                      ) : null}
                      {alert.mailto ? (
                        <a
                          href={`mailto:${alert.mailto}`}
                          className="gp-mono inline-flex items-center gap-1 text-[10px] uppercase text-[#becab8] hover:text-[#83e77b]"
                        >
                          <Mail className="h-3 w-3" aria-hidden />
                          Contactar
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="gp-mono py-8 text-center text-sm text-[#becab8]">Sin alertas activas</p>
          )}
        </div>
      </div>
    </div>
  );
});
