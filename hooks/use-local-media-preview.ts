'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function animationTypeFromFile(file: File): 'gif' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'gif';
}

export function formatMediaFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useLocalMediaPreview() {
  const [pendingFile, setPendingFileState] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const localPreviewUrlRef = useRef<string | null>(null);

  const revokePreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const clearPending = useCallback(() => {
    revokePreviewUrl(localPreviewUrlRef.current);
    localPreviewUrlRef.current = null;
    setLocalPreviewUrl(null);
    setPendingFileState(null);
  }, [revokePreviewUrl]);

  const setPendingFile = useCallback(
    (file: File | null) => {
      revokePreviewUrl(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
      setPendingFileState(null);
      setLocalPreviewUrl(null);
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      localPreviewUrlRef.current = objectUrl;
      setPendingFileState(file);
      setLocalPreviewUrl(objectUrl);
    },
    [revokePreviewUrl],
  );

  useEffect(() => () => revokePreviewUrl(localPreviewUrlRef.current), [revokePreviewUrl]);

  return { pendingFile, localPreviewUrl, setPendingFile, clearPending };
}
