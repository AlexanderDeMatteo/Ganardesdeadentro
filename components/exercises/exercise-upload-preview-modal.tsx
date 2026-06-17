'use client';

import { useEffect } from 'react';
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import {
  animationTypeFromFile,
  formatMediaFileSize,
  useLocalMediaPreview,
} from '@/hooks/use-local-media-preview';
import type { Exercise } from '@/lib/data/types';
import { Loader2 } from 'lucide-react';

type ExerciseUploadPreviewModalProps = {
  open: boolean;
  exercise: Exercise | null;
  file: File | null;
  isUploading?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export function ExerciseUploadPreviewModal({
  open,
  exercise,
  file,
  isUploading = false,
  onClose,
  onConfirm,
}: ExerciseUploadPreviewModalProps) {
  const { pendingFile, localPreviewUrl, setPendingFile, clearPending } = useLocalMediaPreview();

  useEffect(() => {
    if (!open) {
      clearPending();
      return;
    }
    if (file) setPendingFile(file);
  }, [open, file, setPendingFile, clearPending]);

  if (!open || !exercise || !pendingFile || !localPreviewUrl) return null;

  return (
    <PrimeScrollableModal
      title="Vista previa antes de publicar"
      onClose={onClose}
      size="lg"
      fitContent
      modId="EX-02"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <PrimeChamferButton
            type="button"
            onClick={onClose}
            className="bg-transparent text-[var(--gp-text-primary)]"
            disabled={isUploading}
          >
            Cancelar
          </PrimeChamferButton>
          <PrimeChamferButton
            type="button"
            onClick={() => void onConfirm(pendingFile)}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirmar y publicar
          </PrimeChamferButton>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="gp-mono text-sm gp-text-muted">
          Revisa cómo verá el atleta la animación de <strong>{exercise.name}</strong>. Solo se
          publicará si confirmas.
        </p>
        <ExerciseAnimationPlayer
          name={exercise.name}
          animationUrl={localPreviewUrl}
          animationType={animationTypeFromFile(pendingFile)}
        />
        <p className="gp-mono text-xs gp-text-dim">
          {pendingFile.name} · {formatMediaFileSize(pendingFile.size)} · {pendingFile.type || 'archivo'}
        </p>
      </div>
    </PrimeScrollableModal>
  );
}
