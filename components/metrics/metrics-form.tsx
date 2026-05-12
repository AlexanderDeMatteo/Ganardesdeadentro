'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMetrics, MetricEntry } from '@/hooks/use-metrics';
import { Plus, X } from 'lucide-react';

const METRIC_FIELDS = [
  { key: 'weight', label: 'Peso (kg)', placeholder: '85.5' },
  { key: 'bodyFat', label: 'Grasa Corporal (%)', placeholder: '18.5' },
  { key: 'muscleMass', label: 'Masa Muscular (kg)', placeholder: '35.2' },
  { key: 'biceps', label: 'Bíceps (cm)', placeholder: '33' },
  { key: 'chest', label: 'Pecho (cm)', placeholder: '102' },
  { key: 'waist', label: 'Cintura (cm)', placeholder: '79' },
  { key: 'hips', label: 'Cadera (cm)', placeholder: '92' },
  { key: 'thighs', label: 'Muslos (cm)', placeholder: '54' },
  { key: 'calves', label: 'Pantorrillas (cm)', placeholder: '37' },
];

export function MetricsForm() {
  const { addEntry } = useMetrics();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert form data to metric entry
      const entry: Omit<MetricEntry, 'id'> = {
        date: new Date().toISOString(),
      };

      METRIC_FIELDS.forEach(({ key }) => {
        const value = parseFloat(formData[key]);
        if (!isNaN(value)) {
          (entry as any)[key] = value;
        }
      });

      if (formData.notes) {
        entry.notes = formData.notes;
      }

      addEntry(entry);
      setFormData({});
      setIsOpen(false);

      // Success feedback
      console.log('[v0] Métrica guardada exitosamente');
    } catch (error) {
      console.error('[v0] Error guardando métrica:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Agregar Nueva Medición
        </Button>
      </div>

      {isOpen && (
        <div className="brand-card mb-8 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Nueva Medición</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {METRIC_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <label htmlFor={key} className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
                    {label}
                  </label>
                  <Input
                    id={key}
                    type="number"
                    step="0.1"
                    placeholder={placeholder}
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="h-10"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                placeholder="Cómo te sientes hoy, qué cambios notaste, etc."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="h-24 w-full resize-none rounded-lg border border-input bg-input/50 p-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Medición'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
