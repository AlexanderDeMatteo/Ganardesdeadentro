'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBodyProfile } from '@/hooks/use-body-profile';
import { useMetrics, type MetricEntry, type BodyFatSource } from '@/hooks/use-metrics';
import { estimateBodyFatFromWeightAndProfile } from '@/lib/estimate-body-fat';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

const METRIC_FIELDS = [
  { key: 'weight', label: 'Peso (kg)', placeholder: '85.5' },
  { key: 'bodyFat', label: 'Grasa corporal (%) — opcional', placeholder: '18.5' },
  { key: 'muscleMass', label: 'Masa Muscular (kg)', placeholder: '35.2' },
  { key: 'biceps', label: 'Bíceps (cm)', placeholder: '33' },
  { key: 'chest', label: 'Pecho (cm)', placeholder: '102' },
  { key: 'waist', label: 'Cintura (cm)', placeholder: '79' },
  { key: 'hips', label: 'Cadera (cm)', placeholder: '92' },
  { key: 'thighs', label: 'Muslos (cm)', placeholder: '54' },
  { key: 'calves', label: 'Pantorrillas (cm)', placeholder: '37' },
] as const;

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

type FieldKey = (typeof METRIC_FIELDS)[number]['key'];

const GROUPS: { title: string; keys: FieldKey[] }[] = [
  { title: 'Composición corporal', keys: ['weight', 'bodyFat', 'muscleMass'] },
  { title: 'Tren superior', keys: ['biceps', 'chest'] },
  { title: 'Core y cadera', keys: ['waist', 'hips'] },
  { title: 'Tren inferior', keys: ['thighs', 'calves'] },
];

function renderField(
  key: FieldKey,
  label: string,
  placeholder: string,
  formData: Record<string, string>,
  handleInputChange: (key: string, value: string) => void,
  idPrefix: string,
  extras?: {
    bodyFat?: {
      showEstimate: boolean;
      estimatedValue: number | null;
      isLoaded: boolean;
      onEstimate: () => void;
    };
  },
) {
  const inputId = `${idPrefix}${key}`;

  if (key === 'bodyFat') {
    const bf = extras?.bodyFat;
    return (
      <div key={key} className="space-y-2 lg:col-span-2">
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
          className="h-10"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Si tu báscula muestra % grasa, introdúcelo aquí. Si no, completa tu perfil en{' '}
          <Link href="/profile" className="font-semibold text-secondary underline-offset-2 hover:underline">
            Mi perfil
          </Link>{' '}
          (talla, edad, sexo) y usa el botón de abajo.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-secondary text-secondary hover:bg-secondary/10"
            disabled={!bf?.showEstimate || bf.estimatedValue == null}
            onClick={bf?.onEstimate}
          >
            Estimar a partir de mi perfil
          </Button>
          {bf && !bf.showEstimate && bf.isLoaded && (
            <span className="text-xs text-muted-foreground">
              Indica peso arriba y completa talla, edad y sexo en perfil (18+ años).
            </span>
          )}
        </div>
      </div>
    );
  }

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
        className="h-10"
      />
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
  const { profile, isLoaded, canEstimateBodyFat } = useBodyProfile();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [bodyFatSourceDraft, setBodyFatSourceDraft] = useState<BodyFatSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBodyFatSourceDraft(null);
    }
  }, [isOpen]);

  const handleInputChange = (key: string, value: string) => {
    if (key === 'bodyFat') {
      setBodyFatSourceDraft('manual');
    }
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const weightKg = parseFloat(String(formData.weight ?? '').replace(',', '.'));
  const showEstimate = isLoaded && canEstimateBodyFat(weightKg);
  const estimatedValue =
    showEstimate && Number.isFinite(weightKg) ? estimateBodyFatFromWeightAndProfile(weightKg, profile) : null;

  const handleEstimateBodyFat = () => {
    if (estimatedValue == null) return;
    setBodyFatSourceDraft('estimated');
    setFormData((prev) => ({
      ...prev,
      bodyFat: estimatedValue.toFixed(1),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const entry: Omit<MetricEntry, 'id'> = {
        date: new Date().toISOString(),
      };

      METRIC_FIELDS.forEach(({ key }) => {
        if (key === 'bodyFat') {
          const value = parseFloat(String(formData[key] ?? '').replace(',', '.'));
          if (!isNaN(value)) {
            entry.bodyFat = value;
            entry.bodyFatSource = bodyFatSourceDraft === 'estimated' ? 'estimated' : 'manual';
          }
          return;
        }
        const value = parseFloat(String(formData[key] ?? '').replace(',', '.'));
        if (!isNaN(value)) {
          (entry as Record<string, unknown>)[key] = value;
        }
      });

      if (formData.notes) {
        entry.notes = formData.notes;
      }

      addEntry(entry);
      setFormData({});
      setBodyFatSourceDraft(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error guardando métrica:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldMap = Object.fromEntries(METRIC_FIELDS.map((f) => [f.key, f])) as Record<
    FieldKey,
    (typeof METRIC_FIELDS)[number]
  >;

  const bodyFatExtras = {
    showEstimate,
    estimatedValue,
    isLoaded,
    onEstimate: handleEstimateBodyFat,
  };

  const notesBlock = (
    <div className="space-y-2">
      <label htmlFor={`${idPrefix}notes`} className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
        Notas (opcional)
      </label>
      <textarea
        id={`${idPrefix}notes`}
        placeholder="Cómo te sientes hoy, qué cambios notaste, etc."
        value={formData.notes || ''}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        className="h-24 w-full resize-none rounded-lg border border-input bg-input/50 p-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    </div>
  );

  const renderDefaultGrid = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {METRIC_FIELDS.map(({ key, label, placeholder }) =>
        renderField(key, label, placeholder, formData, handleInputChange, idPrefix, {
          bodyFat: bodyFatExtras,
        }),
      )}
    </div>
  );

  const renderGroupedOrZoned = (zoned: boolean) => (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[10px] font-extrabold uppercase tracking-[0.18em]',
                zoned ? 'rounded-full bg-primary/15 px-3 py-1 text-primary' : 'text-muted-foreground',
              )}
            >
              {group.title}
            </span>
            {zoned && <span className="h-px flex-1 bg-border" />}
          </div>
          <div
            className={cn(
              'grid gap-4',
              group.keys.includes('bodyFat') ? 'md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
            )}
          >
            {group.keys.map((key) => {
              const f = fieldMap[key];
              return renderField(f.key, f.label, f.placeholder, formData, handleInputChange, idPrefix, {
                bodyFat: bodyFatExtras,
              });
            })}
          </div>
        </div>
      ))}
      {notesBlock}
    </div>
  );

  const formInner = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {variant === 'default' ? (
        <>
          {renderDefaultGrid()}
          {notesBlock}
        </>
      ) : (
        renderGroupedOrZoned(variant === 'zoned')
      )}

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
