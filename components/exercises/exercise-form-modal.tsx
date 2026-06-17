'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ExerciseAnimationPlayer } from '@/components/exercises/exercise-animation-player';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  animationTypeFromFile,
  formatMediaFileSize,
  useLocalMediaPreview,
} from '@/hooks/use-local-media-preview';
import {
  createExercise,
  listExerciseMuscles,
  matchExerciseAnimation,
  updateExercise,
  uploadExerciseMedia,
} from '@/lib/data/client';
import type { Difficulty, Exercise } from '@/lib/data/types';
import { Loader2, RefreshCw, Upload, X } from 'lucide-react';

type ExerciseFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (exercise: Exercise) => void | Promise<void>;
  initialExercise?: Exercise | null;
  prime?: boolean;
};

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'expert'];

const DEFAULT_CUSTOM_MUSCLE = 'general';

export function ExerciseFormModal({
  open,
  onClose,
  onSaved,
  initialExercise,
  prime = false,
}: ExerciseFormModalProps) {
  const [name, setName] = useState('');
  const [targetMuscle, setTargetMuscle] = useState(DEFAULT_CUSTOM_MUSCLE);
  const [equipment, setEquipment] = useState('body weight');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [description, setDescription] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingFile, localPreviewUrl, setPendingFile, clearPending } = useLocalMediaPreview();

  useEffect(() => {
    if (!open) return;
    void listExerciseMuscles({ source: 'catalog' })
      .then(async (catalogMuscles) => {
        if (catalogMuscles.length > 0) {
          setMuscles(catalogMuscles);
          return;
        }
        const apiMuscles = await listExerciseMuscles({ source: 'api' });
        setMuscles(apiMuscles);
      })
      .catch(() => setMuscles([]));
  }, [open]);

  useEffect(() => {
    if (!open) {
      clearPending();
      return;
    }
    if (initialExercise) {
      setName(initialExercise.name);
      setTargetMuscle(initialExercise.targetMuscle);
      setEquipment(initialExercise.equipment);
      setDifficulty(initialExercise.difficulty);
      setDescription(initialExercise.description ?? '');
      setPreview(initialExercise);
      clearPending();
      return;
    }
    setName('');
    setTargetMuscle(muscles[0] ?? DEFAULT_CUSTOM_MUSCLE);
    setEquipment('body weight');
    setDifficulty('beginner');
    setDescription('');
    setPreview(null);
    clearPending();
  }, [open, initialExercise, clearPending, muscles]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        targetMuscle: targetMuscle.trim(),
        equipment: equipment.trim(),
        difficulty,
        description: description.trim() || undefined,
      };
      const saved = initialExercise
        ? await updateExercise(initialExercise.id, payload)
        : await createExercise(payload);
      setPreview(saved);
      await onSaved(saved);
      toast.success(initialExercise ? 'Ejercicio actualizado' : 'Ejercicio creado');
      if (initialExercise) {
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el ejercicio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMatch = async () => {
    const exerciseId = preview?.id ?? initialExercise?.id;
    if (!exerciseId) {
      toast.error('Guarda el ejercicio antes de buscar animación');
      return;
    }
    setIsMatching(true);
    try {
      const matched = await matchExerciseAnimation(exerciseId);
      clearPending();
      setPreview(matched);
      onSaved(matched);
      toast.success(
        matched.animationUrl ? 'Animación encontrada en catálogo' : 'Sin coincidencias en catálogo',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo buscar animación');
    } finally {
      setIsMatching(false);
    }
  };

  const handleConfirmUpload = async () => {
    const exerciseId = preview?.id ?? initialExercise?.id;
    if (!exerciseId || !pendingFile) {
      toast.error('Selecciona un archivo para subir');
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await uploadExerciseMedia(exerciseId, pendingFile);
      clearPending();
      setPreview(uploaded);
      onSaved(uploaded);
      toast.success('Animación publicada correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const currentPreview = preview ?? initialExercise ?? null;
  const displayAnimationUrl = localPreviewUrl ?? currentPreview?.animationUrl;
  const displayAnimationType = pendingFile
    ? animationTypeFromFile(pendingFile)
    : currentPreview?.animationType;
  const ModalShell = prime ? PrimeScrollableModal : null;

  const formBody = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exercise-name" className="gp-mono text-xs gp-text-muted">
          Nombre
        </Label>
        <Input
          id="exercise-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Sentadilla búlgara"
          className="gp-field gp-mono h-10 rounded-lg px-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exercise-muscle" className="gp-mono text-xs gp-text-muted">
            Músculo objetivo
          </Label>
          {muscles.length > 0 ? (
            <select
              id="exercise-muscle"
              value={targetMuscle}
              onChange={(e) => setTargetMuscle(e.target.value)}
              className="gp-field gp-mono h-10 w-full rounded-lg px-3 text-sm"
            >
              {muscles.map((muscle) => (
                <option key={muscle} value={muscle}>
                  {muscle}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="exercise-muscle"
              value={targetMuscle}
              onChange={(e) => setTargetMuscle(e.target.value)}
              placeholder="Ej. pectorals, quads"
              className="gp-field gp-mono h-10 rounded-lg px-3 text-sm"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="exercise-equipment" className="gp-mono text-xs gp-text-muted">
            Equipo
          </Label>
          <Input
            id="exercise-equipment"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="gp-field gp-mono h-10 rounded-lg px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise-difficulty" className="gp-mono text-xs gp-text-muted">
          Dificultad
        </Label>
        <select
          id="exercise-difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="gp-field gp-mono h-10 w-full rounded-lg px-3 text-sm"
        >
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise-description" className="gp-mono text-xs gp-text-muted">
          Descripción
        </Label>
        <textarea
          id="exercise-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="gp-field gp-mono w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {currentPreview ? (
        <div className="space-y-3 rounded-lg border gp-border p-3">
          <p className="gp-mono text-xs gp-text-muted">
            {pendingFile
              ? 'Vista previa local — el atleta la verá solo después de confirmar'
              : 'Vista previa de animación publicada'}
          </p>
          <ExerciseAnimationPlayer
            name={currentPreview.name}
            animationUrl={displayAnimationUrl}
            animationType={displayAnimationType}
            className="max-h-44"
          />
          {pendingFile ? (
            <p className="gp-mono text-xs gp-text-dim">
              {pendingFile.name} · {formatMediaFileSize(pendingFile.size)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <PrimeChamferButton
              type="button"
              onClick={() => void handleMatch()}
              disabled={isMatching || isUploading}
            >
              {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Buscar en catálogo
            </PrimeChamferButton>
            {!pendingFile ? (
              <PrimeChamferButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                Elegir GIF/video
              </PrimeChamferButton>
            ) : (
              <>
                <PrimeChamferButton type="button" onClick={() => void handleConfirmUpload()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Confirmar y publicar
                </PrimeChamferButton>
                <PrimeChamferButton
                  type="button"
                  onClick={clearPending}
                  disabled={isUploading}
                  className="bg-transparent text-[var(--gp-text-primary)]"
                >
                  <X className="h-4 w-4" />
                  Descartar archivo
                </PrimeChamferButton>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/gif,image/webp,video/mp4"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPendingFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2">
      <PrimeChamferButton type="button" onClick={onClose} className="bg-transparent text-[var(--gp-text-primary)]">
        Cancelar
      </PrimeChamferButton>
      <PrimeChamferButton type="button" onClick={() => void handleSave()} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {initialExercise ? 'Guardar cambios' : 'Crear ejercicio'}
      </PrimeChamferButton>
    </div>
  );

  if (ModalShell) {
    return (
      <ModalShell
        title={initialExercise ? 'Editar ejercicio' : 'Crear ejercicio'}
        onClose={onClose}
        footer={footer}
        size="xl"
        fitContent
        modId="65"
      >
        {formBody}
      </ModalShell>
    );
  }

  return null;
}
