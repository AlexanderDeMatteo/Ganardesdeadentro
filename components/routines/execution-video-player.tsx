'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/session-store';
import { cn } from '@/lib/utils';

type ExecutionVideoPlayerProps = {
  src: string;
  className?: string;
  mutedClassName?: string;
};

export function ExecutionVideoPlayer({
  src,
  className,
  mutedClassName,
}: ExecutionVideoPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(false);
      setBlobUrl(null);

      try {
        const url = src.startsWith('http') ? src : `${getApiBaseUrl()}${src}`;
        const token = getAccessToken();
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (loading) {
    return (
      <p className={cn('text-xs', mutedClassName ?? 'text-muted-foreground')}>Cargando video…</p>
    );
  }

  if (error || !blobUrl) {
    return (
      <p className={cn('text-xs text-destructive', className)} role="alert">
        No se pudo cargar el video de ejecución
      </p>
    );
  }

  return (
    <video
      src={blobUrl}
      controls
      className={className}
      preload="metadata"
    >
      <track kind="captions" />
    </video>
  );
}
