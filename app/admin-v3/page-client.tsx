'use client';

import { useState } from 'react';
import { HudPanel } from '@/components/admin-v3/hud-panel';
import { useAdminDashboardMetrics } from '@/hooks/use-admin-dashboard-metrics';
import { AlertTriangle, Grid3x3, LayoutGrid, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `hace ${hours}h`;
}

export default function AdminV3DashboardPage() {
  const [dismissedAnomaly, setDismissedAnomaly] = useState(false);
  const {
    isLoading,
    athleteCount,
    assignmentRate,
    athletesWithoutTrainer,
    routineCount,
    topTrainerLoads,
    telemetry,
    commandFeed,
    unassignedAthletes,
  } = useAdminDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded bg-[#19211d]/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="mb-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#68ca62]">
          BE A GAINER // COMANDO LIFE
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-3">
          <HudPanel title="CARGA_ACTUAL" subtitle="RECURSOS">
            <div className="space-y-4">
              {topTrainerLoads.slice(0, 2).map(({ trainer, loadPercent }, index) => (
                <div key={trainer.id}>
                  <div className="mb-1 flex justify-between text-[11px] uppercase">
                    <span className="text-[#dce5de]">
                      {index === 0 ? 'Escuadrón Alfa' : 'Unidad Beta'} ({trainer.name})
                    </span>
                    <span className="text-[#68ca62]">CARGA // {loadPercent}%</span>
                  </div>
                  <div className="hud-load-bar">
                    <div
                      className="hud-load-bar-fill transition-all"
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>
              ))}
              {topTrainerLoads.length === 0 ? (
                <p className="text-xs text-[#8fa88a]">Sin entrenadores activos</p>
              ) : null}
            </div>
          </HudPanel>

          <HudPanel title="ESTADO_ENTRENADORES">
            <ul className="space-y-3">
              {topTrainerLoads.slice(0, 4).map(({ trainer, athleteCount }) => (
                <li key={trainer.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#dce5de]">{trainer.name}</span>
                  <span className="flex items-center gap-2 uppercase">
                    <span
                      className={cn(
                        'hud-pulse-dot',
                        athleteCount > 0 ? '' : 'is-offline',
                      )}
                    />
                    {athleteCount > 0 ? 'EN SESIÓN' : 'DISPONIBLE'}
                  </span>
                </li>
              ))}
            </ul>
          </HudPanel>

          <HudPanel title="TELEMETRÍA_RECIENTE">
            <ul className="space-y-2 text-[11px]">
              {telemetry.map((event) => (
                <li
                  key={event.id}
                  className={cn(
                    'border-l-2 pl-2',
                    event.severity === 'critical'
                      ? 'border-[#ffb4ab] text-[#ffb4ab]'
                      : event.severity === 'warning'
                        ? 'border-[#f2b84b] text-[#f2b84b]'
                        : 'border-[#68ca62]/50 text-[#8fa88a]',
                  )}
                >
                  <span className="text-[#8fa88a]">{formatRelativeTime(event.timestamp)}</span>
                  <br />
                  {event.message}
                </li>
              ))}
            </ul>
          </HudPanel>
        </div>

        {/* Center column */}
        <div className="lg:col-span-6">
          <HudPanel
            title="[ DASHBOARD ]"
            className="min-h-[420px]"
            headerAction={
              <Grid3x3 className="h-4 w-4 text-[#68ca62]" aria-hidden />
            }
          >
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center border border-[#68ca62]/50 bg-[#68ca62]/10">
                <LayoutGrid className="h-7 w-7 text-[#68ca62]" aria-hidden />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-[#8fa88a]">
                SISTEMA {athletesWithoutTrainer === 0 ? 'ÓPTIMO' : 'ALERTA'}
              </p>
              <p className="mt-1 text-[10px] text-[#68ca62]/80">
                [ COMANDO_CENTRAL // DASHBOARD ]
              </p>
              <div className="mt-8 grid w-full max-w-md gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase text-[#8fa88a]">ATLETAS_ACTIVOS</p>
                  <p className="hud-stat-value">{athleteCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#8fa88a]">CARGA_SISTEMA</p>
                  <p className="hud-stat-value">{assignmentRate}%</p>
                </div>
              </div>
              <p className="mt-8 text-xs text-[#8fa88a]">
                RUTINAS_ACTIVAS: {routineCount} {'//'} ENTRENADORES_EN_RED: {topTrainerLoads.length}
              </p>
            </div>
          </HudPanel>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-3">
          {!dismissedAnomaly && athletesWithoutTrainer > 0 ? (
            <HudPanel
              title="ANOMALÍAS_MEMBRESÍA"
              headerAction={<AlertTriangle className="h-4 w-4 text-[#ffb4ab]" aria-hidden />}
            >
              <div className="rounded border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-3">
                <p className="text-[10px] uppercase text-[#ffb4ab]">EXPIRACIÓN_INMINENTE</p>
                <p className="mt-2 text-xs text-[#dce5de]">
                  {athletesWithoutTrainer} atleta(s) pendientes de asignación de entrenador.
                </p>
              </div>
            </HudPanel>
          ) : null}

          <HudPanel title="FEED_COMANDOS">
            <ul className="space-y-4">
              {commandFeed.length > 0 ? (
                commandFeed.map((item) => (
                  <li key={item.id} className="border-b border-[#68ca62]/10 pb-3 last:border-0">
                    <p className="text-[10px] uppercase text-[#68ca62]">{item.label}</p>
                    <p className="mt-1 text-xs text-[#dce5de]">{item.detail}</p>
                    <Link
                      href={item.href}
                      className="mt-2 inline-block border border-[#68ca62]/40 px-2 py-0.5 text-[10px] uppercase text-[#68ca62] hover:bg-[#68ca62]/10"
                    >
                      Asignar
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#8fa88a]">Sin comandos pendientes</li>
              )}
              {routineCount > 0 ? (
                <li className="border-b border-[#68ca62]/10 pb-3">
                  <p className="text-[10px] uppercase text-[#68ca62]">RUTINA_ACTIVA</p>
                  <p className="mt-1 text-xs text-[#dce5de]">
                    {routineCount} rutinas en plataforma
                  </p>
                </li>
              ) : null}
            </ul>
          </HudPanel>

          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="flex-1 border-[#68ca62]/40 bg-transparent text-[10px] uppercase text-[#68ca62] hover:bg-[#68ca62]/10"
            >
              <Link href="/admin-v3/assignments">
                <Zap className="mr-1 h-3 w-3" aria-hidden />
                Resolver_tod
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-[10px] uppercase text-[#8fa88a] hover:text-[#dce5de]"
              onClick={() => setDismissedAnomaly(true)}
            >
              Ignorar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
