'use client';

import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBodyProfile } from '@/hooks/use-body-profile';
import { useMetrics, type MetricEntry, type BodyFatSource, type MuscleMassSource } from '@/hooks/use-metrics';
import { resolveBodyComposition } from '@/lib/body-composition';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

export type MetricsFormVariant = 'default' | 'grouped' | 'zoned';

export type MetricsFormProps = {
  /** Presentación del panel y campos (misma lógica de guardado). */
  variant?: MetricsFormVariant;
  /** Si el panel del formulario inicia abierto. */
  defaultOpen?: boolean;
  /** Prefijo para ids de inputs (evita duplicados si en el futuro hay varios formularios montados). */
  idPrefix?: string;
  /** Botón y tarjeta más compactos (p. ej. columna lateral). */
  compact?: boolean;
};

function parseOptionalFloat(raw: string | undefined): number | null {
  const value = parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function renderNumberField(
  key: string,
  label: string,
  placeholder: string,
  formData: Record<string, string>,
  handleInputChange: (key: string, value: string) => void,
  idPrefix: string,
  helperText?: ReactNode,
) {
  const inputId = `${idPrefix}${key}`;
  return (
    <div key={key} className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
        {label}
      </label>
      <Input
        id={inputId}
        type="number"
        step="0.1"
        placeholder={placeholder}
        value={formData[key] || ''}
        onChange={(e) => handleInputChange(key, e.target.value)}
        className="h-11 border-border/70 bg-black/50 focus-visible:ring-1 focus-visible:ring-primary"
      />
      {helperText ? <p className="text-xs leading-relaxed text-muted-foreground">{helperText}</p> : null}
    </div>
  );
}

function renderBilateralFields(
  baseId: string,
  label: string,
  leftKey: string,
  rightKey: string,
  placeholder: string,
  formData: Record<string, string>,
  handleInputChange: (key: string, value: string) => void,
  idPrefix: string,
) {
  const leftId = `${idPrefix}${leftKey}`;
  const rightId = `${idPrefix}${rightKey}`;
  return (
    <div className="space-y-2">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">{label}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={leftId} className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Izq
          </label>
          <Input
            id={leftId}
            type="number"
            step="0.1"
            placeholder={placeholder}
            value={formData[leftKey] || ''}
            onChange={(e) => handleInputChange(leftKey, e.target.value)}
            className="h-11 border-border/70 bg-black/50 focus-visible:ring-1 focus-visible:ring-primary"
            data-field-group={baseId}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={rightId} className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Der
          </label>
          <Input
            id={rightId}
            type="number"
            step="0.1"
            placeholder={placeholder}
            value={formData[rightKey] || ''}
            onChange={(e) => handleInputChange(rightKey, e.target.value)}
            className="h-11 border-border/70 bg-black/50 focus-visible:ring-1 focus-visible:ring-primary"
            data-field-group={baseId}
          />
        </div>
      </div>
    </div>
  );
}

export function MetricsForm({
  variant = 'default',
  defaultOpen = false,
  idPrefix = 'metric-',
  compact = false,
}: MetricsFormProps) {
  const { addEntry } = useMetrics();
  const { profile, isLoaded } = useBodyProfile();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [bodyFatSourceDraft, setBodyFatSourceDraft] = useState<BodyFatSource | null>(null);
  const [muscleMassSourceDraft, setMuscleMassSourceDraft] = useState<MuscleMassSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBodyFatSourceDraft(null);
      setMuscleMassSourceDraft(null);
    }
  }, [isOpen]);

  const handleInputChange = (key: string, value: string) => {
    if (key === 'bodyFat') {
      setBodyFatSourceDraft('manual');
    }
    if (key === 'muscleMass') {
      setMuscleMassSourceDraft('manual');
    }
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const weightKg = parseOptionalFloat(formData.weight);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const entry: Omit<MetricEntry, 'id' | 'athleteId'> = {
        date: new Date().toISOString(),
      };

      const resolved = resolveBodyComposition({
        weightKg,
        bodyFatPercent: parseOptionalFloat(formData.bodyFat),
        muscleMassKg: parseOptionalFloat(formData.muscleMass),
        profile,
        bodyFatSourceDraft: bodyFatSourceDraft ?? null,
        muscleMassSourceDraft: muscleMassSourceDraft ?? null,
      });

      const directNumericFields: Array<keyof Omit<MetricEntry, 'id' | 'athleteId' | 'date'>> = [
        'weight',
        'chest',
        'waist',
        'hips',
        'bicepsLeft',
        'bicepsRight',
        'thighLeft',
        'thighRight',
        'calfLeft',
        'calfRight',
      ];
      directNumericFields.forEach((key) => {
        const value = parseOptionalFloat(formData[key]);
        if (value != null) {
          (entry as Record<string, unknown>)[key] = value;
        }
      });

      if (resolved.bodyFat != null) {
        entry.bodyFat = resolved.bodyFat;
        entry.bodyFatSource = resolved.bodyFatSource;
      }
      if (resolved.muscleMass != null) {
        entry.muscleMass = resolved.muscleMass;
        entry.muscleMassSource = resolved.muscleMassSource;
      }

      if (formData.notes) {
        entry.notes = formData.notes;
      }

      addEntry(entry);
      setFormData({});
      setBodyFatSourceDraft(null);
      setMuscleMassSourceDraft(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error guardando métrica:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const notesBlock = (
      <div className="space-y-3">
      <label htmlFor={`${idPrefix}notes`} className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
        Notas (opcional)
      </label>
      <textarea
        id={`${idPrefix}notes`}
        placeholder="Cómo te sientes hoy, qué cambios notaste, etc."
        value={formData.notes || ''}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        className="h-24 w-full resize-none rounded-lg border border-border/70 bg-black/50 p-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
    </div>
  );

  const sectionTitleClass = cn(
    'text-[11px] font-extrabold uppercase tracking-[0.18em]',
    variant === 'zoned' ? 'inline-flex rounded-full bg-primary/15 px-3 py-1 text-primary' : 'text-muted-foreground',
  );
  const sectionClass = cn(
    'space-y-4 rounded-xl border border-border/60 bg-surface p-4',
    variant === 'zoned' && 'border-primary/30 bg-primary/[0.03]',
  );

  const formInner = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Métricas generales</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderNumberField('weight', 'Peso (kg)', '85.5', formData, handleInputChange, idPrefix)}
          {renderNumberField(
            'bodyFat',
            'Grasa corporal (%) — opcional si usas báscula',
            '18.5',
            formData,
            handleInputChange,
            idPrefix,
            <>
              Si tu báscula muestra % grasa, introdúcelo aquí. Si no, completa tu perfil en{' '}
              <Link href="/profile" className="font-semibold text-secondary underline-offset-2 hover:underline">
                Mi perfil
              </Link>{' '}
              (talla, edad, sexo). Al guardar se estima composición automáticamente cuando aplica.
            </>,
          )}
          {renderNumberField(
            'muscleMass',
            'Masa muscular (kg) — opcional',
            '35.2',
            formData,
            handleInputChange,
            idPrefix,
            !isLoaded
              ? 'Cargando perfil para estimar composición automática.'
              : 'Si queda vacío, se intentará calcular automáticamente al guardar.',
          )}
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitleClass}>Tren superior</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {renderNumberField('chest', 'Pecho (cm)', '102', formData, handleInputChange, idPrefix)}
          {renderBilateralFields(
            'biceps',
            'Bíceps (cm)',
            'bicepsLeft',
            'bicepsRight',
            '33',
            formData,
            handleInputChange,
            idPrefix,
          )}
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitleClass}>Tren inferior</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {renderNumberField('waist', 'Cintura (cm)', '79', formData, handleInputChange, idPrefix)}
          {renderNumberField('hips', 'Cadera (cm)', '92', formData, handleInputChange, idPrefix)}
          {renderBilateralFields(
            'thigh',
            'Muslos (cm)',
            'thighLeft',
            'thighRight',
            '54',
            formData,
            handleInputChange,
            idPrefix,
          )}
          {renderBilateralFields(
            'calf',
            'Pantorrillas (cm)',
            'calfLeft',
            'calfRight',
            '37',
            formData,
            handleInputChange,
            idPrefix,
          )}
        </div>
      </div>

      {notesBlock}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(false)}
          className="border-secondary text-secondary hover:bg-secondary/10"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? 'Guardando...' : 'Guardar Medición'}
        </Button>
      </div>
    </form>
  );

  const triggerRow = (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        compact ? 'mb-4' : 'mb-8',
      )}
    >
      <div>
        <p className="brand-kicker text-[10px]">Registro</p>
        <p className="text-sm font-semibold text-foreground">Nueva medición corporal</p>
        <p className="text-xs text-muted-foreground">Todos los campos del formulario original se mantienen aquí.</p>
      </div>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={compact ? 'outline' : 'default'}
        size={compact ? 'sm' : 'default'}
        className={cn('gap-2 shrink-0', compact && 'border-secondary text-secondary')}
      >
        <Plus className="h-5 w-5" />
        Agregar Nueva Medición
      </Button>
    </div>
  );

  return (
    <>
      {triggerRow}

      {isOpen && (
        <div
          className={cn(
            'brand-card mb-8 rounded-2xl',
            compact ? 'p-5 sm:p-6' : 'p-8',
            variant === 'zoned' && 'border-primary/25',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Nueva Medición</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 transition-colors hover:bg-secondary/10"
              aria-label="Cerrar formulario de medición"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {formInner}
        </div>
      )}
    </>
  );
}
