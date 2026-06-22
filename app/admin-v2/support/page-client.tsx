'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useRealtime } from '@/app/context/realtime-context';
import { SupportChat } from '@/components/support/support-chat';
import { listSupportThreads } from '@/lib/data/client';
import type { SupportMessage, SupportThread } from '@/lib/api/contracts/support';
import { cn } from '@/lib/utils';

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const { subscribe } = useRealtime();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  const athleteFromQuery = searchParams.get('athlete');

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listSupportThreads();
      setThreads(data);
      return data;
    } catch {
      setThreads([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const data = await loadThreads();
      if (cancelled) return;
      if (athleteFromQuery) {
        setSelectedAthleteId(athleteFromQuery);
        setChatRefreshKey((key) => key + 1);
      } else if (data.length > 0) {
        setSelectedAthleteId((current) => current ?? data[0].athleteId);
      } else {
        setSelectedAthleteId(null);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [athleteFromQuery, loadThreads]);

  useEffect(() => {
    return subscribe('support:message', (payload) => {
      const message = payload as SupportMessage;
      if (!message?.athleteId) return;
      void loadThreads();
    });
  }, [loadThreads, subscribe]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.athleteId === selectedAthleteId) ?? null,
    [selectedAthleteId, threads],
  );

  const handleSelectThread = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setChatRefreshKey((key) => key + 1);
  };

  const handleLoadError = useCallback(
    (message: string) => {
      if (message.toLowerCase().includes('no encontrada')) {
        toast.error('La conversación ya no está disponible');
        setSelectedAthleteId(null);
        void loadThreads();
      }
    },
    [loadThreads],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border gp-border-outline bg-[#0d1511]/90">
        <div className="border-b gp-border-outline px-4 py-3">
          <h2 className="gp-mono text-sm font-bold uppercase text-[#83e77b]">Bandeja de soporte</h2>
          <p className="mt-1 text-xs gp-text-muted">Conversaciones con atletas</p>
        </div>
        <div className="max-h-[min(72vh,720px)] overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-6 text-sm gp-text-muted">Cargando hilos…</p>
          ) : threads.length === 0 ? (
            <p className="px-4 py-6 text-sm gp-text-muted">
              Aún no hay conversaciones. Cuando un atleta escriba, aparecerá aquí.
            </p>
          ) : (
            threads.map((thread) => {
              const athleteName = thread.athlete
                ? `${thread.athlete.firstName} ${thread.athlete.lastName}`.trim()
                : `Atleta #${thread.athleteId}`;
              const isActive = thread.athleteId === selectedAthleteId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleSelectThread(thread.athleteId)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b gp-border-outline px-4 py-3 text-left transition-colors',
                    isActive ? 'bg-[#1a2a20]' : 'hover:bg-[#141d19]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[#e8f0e4]">
                      {athleteName}
                    </span>
                    {thread.unreadForAdmin > 0 ? (
                      <span className="gp-mono rounded-full bg-[#ffb4ab] px-2 py-0.5 text-[10px] font-bold text-[#2a1515]">
                        {thread.unreadForAdmin}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs gp-text-muted">
                    {thread.lastMessagePreview || 'Sin mensajes'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="min-w-0">
        {selectedAthleteId ? (
          <SupportChat
            key={`${selectedAthleteId}-${chatRefreshKey}`}
            athleteId={selectedAthleteId}
            mode="admin"
            title={
              selectedThread?.athlete
                ? `${selectedThread.athlete.firstName} ${selectedThread.athlete.lastName}`.trim()
                : 'Conversación'
            }
            subtitle={selectedThread?.athlete?.email ?? 'Soporte al atleta'}
            emptyHint="No hay mensajes en esta conversación."
            onLoadError={handleLoadError}
          />
        ) : (
          <div className="flex h-[min(72vh,720px)] min-h-[420px] items-center justify-center rounded-2xl border gp-border-outline bg-[#0d1511]/90 px-6 text-center">
            <p className="text-sm gp-text-muted">
              Selecciona una conversación para responder al atleta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
