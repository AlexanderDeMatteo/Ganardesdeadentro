'use client';

import type { MembershipPlan } from '@/hooks/use-memberships';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

type PlanFormData = Omit<MembershipPlan, 'id' | 'createdAt'>;

type PrimeMembershipPlanFormProps = {
  open: boolean;
  editingPlan: MembershipPlan | null;
  formData: PlanFormData;
  isSaving: boolean;
  onChange: (data: PlanFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddFeature: () => void;
  onRemoveFeature: (idx: number) => void;
  onFeatureChange: (idx: number, value: string) => void;
};

const labelClass = 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim';
const inputClass = 'gp-mono h-9 gp-border-outline gp-bg-surface-high gp-text-primary';
const selectClass =
  'gp-mono h-9 w-full rounded-lg border gp-border-outline gp-bg-surface-high px-3 py-2 text-sm gp-text-primary';

export function PrimeMembershipPlanForm({
  open,
  editingPlan,
  formData,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  onAddFeature,
  onRemoveFeature,
  onFeatureChange,
}: PrimeMembershipPlanFormProps) {
  if (!open) return null;

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSaving}
        className="gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="prime-membership-plan-form"
        disabled={isSaving}
        className="gp-mono rounded-full bg-[var(--gp-phosphor)] font-bold text-[#003906] hover:bg-[var(--gp-phosphor-bright)]"
      >
        {isSaving ? 'Guardando…' : editingPlan ? 'Guardar cambios' : 'Crear plan'}
      </Button>
    </div>
  );

  return (
    <PrimeScrollableModal
      title={editingPlan ? 'Editar plan' : 'Crear plan'}
      modId="52"
      onClose={onClose}
      footer={footer}
      size="wide"
      fitContent
    >
      <form id="prime-membership-plan-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="plan-name">
            Nombre comercial
          </label>
          <Input
            id="plan-name"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            placeholder="Plan Verano 2026"
            maxLength={120}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="plan-tier">
              Nivel funcional
            </label>
            <select
              id="plan-tier"
              value={formData.functionalTier}
              onChange={(e) =>
                onChange({
                  ...formData,
                  functionalTier: e.target.value as PlanFormData['functionalTier'],
                })
              }
              className={selectClass}
            >
              <option value="basic">Básico</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="plan-price">
              Precio
            </label>
            <Input
              id="plan-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="29.99"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="plan-description">
            Descripción
          </label>
          <textarea
            id="plan-description"
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            placeholder="Describe este plan..."
            className={`${selectClass} min-h-[4.5rem] resize-y py-2`}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="plan-duration">
              Duración (días)
            </label>
            <Input
              id="plan-duration"
              type="number"
              value={formData.durationDays}
              onChange={(e) =>
                onChange({ ...formData, durationDays: parseInt(e.target.value, 10) || 30 })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="plan-color">
              Color
            </label>
            <select
              id="plan-color"
              value={formData.color}
              onChange={(e) =>
                onChange({ ...formData, color: e.target.value as PlanFormData['color'] })
              }
              className={selectClass}
            >
              <option value="blue">Azul</option>
              <option value="purple">Púrpura</option>
              <option value="amber">Ámbar</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass}>Características</label>
            <button
              type="button"
              onClick={onAddFeature}
              className="gp-mono flex items-center gap-1 text-xs gp-text-phosphor hover:underline"
            >
              <Plus className="h-3 w-3" aria-hidden />
              Agregar
            </button>
          </div>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {formData.features.map((feature, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={feature}
                  onChange={(e) => onFeatureChange(idx, e.target.value)}
                  placeholder={`Característica ${idx + 1}`}
                  className={`${inputClass} flex-1`}
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveFeature(idx)}
                    className="shrink-0 text-[#ffb4ab] hover:text-[#ffb4ab]/80"
                    aria-label={`Eliminar característica ${idx + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </PrimeScrollableModal>
  );
}
