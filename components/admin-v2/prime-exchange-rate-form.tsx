'use client';

import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExchangeRate } from '@/lib/api/contracts/exchange-rates';
import { SOURCE_CURRENCY_OPTIONS, TARGET_CURRENCY_OPTIONS } from '@/lib/constants/currencies';

type FormData = Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>;

type PrimeExchangeRateFormProps = {
  open: boolean;
  editingRate: ExchangeRate | null;
  formData: FormData;
  isSaving: boolean;
  onChange: (data: FormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

const labelClass = 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim';
const inputClass = 'gp-mono h-9 gp-border-outline gp-bg-surface-high gp-text-primary';
const selectClass =
  'gp-mono h-9 w-full rounded-lg border gp-border-outline gp-bg-surface-high px-3 py-2 text-sm gp-text-primary';

export function PrimeExchangeRateForm({
  open,
  editingRate,
  formData,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: PrimeExchangeRateFormProps) {
  if (!open) return null;

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="gp-mono">
        Cancelar
      </Button>
      <Button type="submit" form="prime-exchange-rate-form" disabled={isSaving} className="gp-mono">
        {isSaving ? 'Guardando…' : editingRate ? 'Guardar cambios' : 'Crear tasa'}
      </Button>
    </div>
  );

  return (
    <PrimeScrollableModal
      title={editingRate ? 'Editar tasa de cambio' : 'Agregar tasa de cambio'}
      modId="53"
      onClose={onClose}
      footer={footer}
      size="wide"
      fitContent
    >
      <form id="prime-exchange-rate-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="fromCurrency">Moneda origen</label>
            <select
              id="fromCurrency"
              className={selectClass}
              value={formData.fromCurrency}
              onChange={(e) => onChange({ ...formData, fromCurrency: e.target.value })}
            >
              {SOURCE_CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="toCurrency">Moneda destino</label>
            <select
              id="toCurrency"
              className={selectClass}
              value={formData.toCurrency}
              onChange={(e) => onChange({ ...formData, toCurrency: e.target.value })}
            >
              {TARGET_CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="rate">Tasa de cambio</label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              className={inputClass}
              value={formData.rate}
              onChange={(e) => onChange({ ...formData, rate: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="label">Etiqueta</label>
            <Input
              id="label"
              className={inputClass}
              value={formData.label}
              onChange={(e) => onChange({ ...formData, label: e.target.value })}
              placeholder="USD → VES"
            />
          </div>
        </div>
      </form>
    </PrimeScrollableModal>
  );
}
