'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/app/context/auth-context';
import { useRealtime } from '@/app/context/realtime-context';
import type { SupportMessage } from '@/lib/api/contracts/support';
import {
  getMySupportThread,
  getSupportThread,
  markMySupportThreadRead,
  markSupportThreadRead,
  sendAdminSupportMessage,
  sendAthleteSupportMessage,
} from '@/lib/data/client';
import { cn } from '@/lib/utils';

type UseSupportChatOptions = {
  athleteId: string;
  mode: 'athlete' | 'admin';
  enabled?: boolean;
};

export function useSupportChat({ athleteId, mode, enabled = true }: UseSupportChatOptions) {
  const { isAuthenticated } = useAuth();
  const { subscribe, joinSupportThread, leaveSupportThread, isConnected } = useRealtime();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!athleteId || !enabled || !isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response =
        mode === 'athlete'
          ? await getMySupportThread()
          : await getSupportThread(athleteId);
      setMessages(response.messages ?? []);
      if (response.thread) {
        if (mode === 'athlete') {
          await markMySupportThreadRead();
        } else {
          await markSupportThreadRead(athleteId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el chat');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [athleteId, enabled, isAuthenticated, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!athleteId || !enabled || !isAuthenticated || !isConnected) return;
    joinSupportThread(athleteId);
    return () => leaveSupportThread(athleteId);
  }, [athleteId, enabled, isAuthenticated, isConnected, joinSupportThread, leaveSupportThread]);

  useEffect(() => {
    return subscribe('support:message', (payload) => {
      const message = payload as SupportMessage;
      if (!message?.id || String(message.athleteId) !== String(athleteId)) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
      if (mode === 'athlete' && message.senderRole === 'admin') {
        void markMySupportThreadRead();
      }
      if (mode === 'admin' && message.senderRole === 'user') {
        void markSupportThreadRead(athleteId);
      }
    });
  }, [athleteId, mode, subscribe]);

  useEffect(() => {
    if (!athleteId || !enabled || !isAuthenticated || isConnected) return;
    const intervalId = window.setInterval(() => {
      void load();
    }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [athleteId, enabled, isAuthenticated, isConnected, load]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || isSending) return false;
      setIsSending(true);
      setError(null);
      try {
        const message =
          mode === 'athlete'
            ? await sendAthleteSupportMessage(trimmed)
            : await sendAdminSupportMessage(athleteId, trimmed);
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [athleteId, isSending, mode],
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    send,
    refresh: load,
    isConnected,
  };
}

type SupportChatProps = {
  athleteId: string;
  mode: 'athlete' | 'admin';
  title?: string;
  subtitle?: string;
  emptyHint?: string;
  className?: string;
  enabled?: boolean;
  onLoadError?: (message: string) => void;
};

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function SupportChat({
  athleteId,
  mode,
  title = 'Soporte',
  subtitle = 'Escríbenos si tienes algún problema o duda.',
  emptyHint,
  className,
  enabled = true,
  onLoadError,
}: SupportChatProps) {
  const { messages, isLoading, isSending, error, send, refresh, isConnected } = useSupportChat({
    athleteId,
    mode,
    enabled,
  });
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const defaultEmptyHint =
    mode === 'athlete'
      ? 'Aún no hay mensajes. Cuéntanos en qué podemos ayudarte.'
      : 'No hay mensajes en esta conversación.';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (error && onLoadError) {
      onLoadError(error);
    }
  }, [error, onLoadError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await send(draft);
    if (ok) setDraft('');
  };

  return (
    <div
      className={cn(
        'flex h-[min(72vh,720px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border gp-border-outline bg-[#0d1511]/90',
        className,
      )}
    >
      <div className="border-b gp-border-outline px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="gp-display text-2xl gp-text-phosphor">{title}</h1>
            <p className="mt-1 text-sm gp-text-muted">{subtitle}</p>
          </div>
          {!isConnected ? (
            <span className="gp-mono shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-300">
              Reconectando…
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="text-center text-sm gp-text-muted">Cargando conversación…</p>
        ) : error ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="gp-mono text-xs uppercase text-[#83e77b] hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
            <p className="text-sm gp-text-muted">{emptyHint ?? defaultEmptyHint}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine =
              mode === 'athlete'
                ? message.senderRole === 'user'
                : message.senderRole === 'admin';
            return (
              <div
                key={message.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                    isMine
                      ? 'rounded-br-md bg-[#68ca62] text-[#003906]'
                      : 'rounded-bl-md border gp-border-outline bg-[#1a2420] text-[#e8f0e4]',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={cn(
                      'gp-mono mt-1 text-[10px]',
                      isMine ? 'text-[#003906]/70' : 'text-[#7f8f7a]',
                    )}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="border-t gp-border-outline bg-[#0a110e]/90 px-4 py-3"
      >
        {error && !isLoading && messages.length > 0 ? (
          <p className="mb-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Escribe tu mensaje…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border gp-border-outline bg-[#121a16] px-3 py-2 text-sm text-[#e8f0e4] placeholder:text-[#7f8f7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62]"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(event);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="gp-chamfer gp-mono shrink-0 rounded bg-[#68ca62] px-4 py-2.5 text-sm font-bold text-[#003906] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? '…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
