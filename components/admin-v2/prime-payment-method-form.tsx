'use client';

import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExchangeRate } from '@/lib/api/contracts/exchange-rates';

type MethodType = 'digital' | 'bank' | 'crypto' | 'cash';

type PaymentMethodFormData = {
  name: string;
  category: string;
  methodType: MethodType;
  exchangeRateId: string | null;
  details: Array<{ key: string; value: string }>;
  sortOrder: number;
  isActive: boolean;
};

type PrimePaymentMethodFormProps = {
  open: boolean;
  isSaving: boolean;
  editingId: string | null;
  formData: PaymentMethodFormData;
  exchangeRates: ExchangeRate[];
  onChange: (next: PaymentMethodFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

const labelClass = 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim';
const inputClass = 'gp-mono h-9 gp-border-outline gp-bg-surface-high gp-text-primary';
const selectClass =
  'gp-mono h-9 w-full rounded-lg border gp-border-outline gp-bg-surface-high px-3 py-2 text-sm gp-text-primary';

export function PrimePaymentMethodForm({
  open,
  isSaving,
  editingId,
  formData,
  exchangeRates,
  onChange,
  onClose,
  onSubmit,
}: PrimePaymentMethodFormProps) {
  if (!open) return null;

  const typeNeedsDetails = formData.methodType === 'digital' || formData.methodType === 'bank';

  const footer = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="gp-mono">
        Cancelar
      </Button>
      <Button type="submit" form="prime-payment-method-form" disabled={isSaving} className="gp-mono">
        {isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear método'}
      </Button>
    </div>
  );

  return (
    <PrimeScrollableModal
      title={editingId ? 'Editar método de pago' : 'Nuevo método de pago'}
      modId="54"
      onClose={onClose}
      footer={footer}
      size="wide"
      fitContent
    >
      <form id="prime-payment-method-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="method-name">Nombre del método</label>
          <Input
            id="method-name"
            className={inputClass}
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="method-type">Tipo</label>
            <select
              id="method-type"
              className={selectClass}
              value={formData.methodType}
              onChange={(e) => onChange({ ...formData, methodType: e.target.value as MethodType })}
            >
              <option value="digital">Digital</option>
              <option value="bank">Banco</option>
              <option value="crypto">Cripto</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="method-rate">Tasa de cambio</label>
            <select
              id="method-rate"
              className={selectClass}
              value={formData.exchangeRateId ?? 'none'}
              onChange={(e) => onChange({ ...formData, exchangeRateId: e.target.value === 'none' ? null : e.target.value })}
            >
              <option value="none">Sin conversión (USD)</option>
              {exchangeRates.map((rate) => (
                <option key={rate.id} value={rate.id}>{rate.label || `${rate.fromCurrency} → ${rate.toCurrency}`}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="method-category">Categoría</label>
          <Input
            id="method-category"
            className={inputClass}
            value={formData.category}
            onChange={(e) => onChange({ ...formData, category: e.target.value })}
          />
        </div>
        {typeNeedsDetails && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Detalles del método</label>
              <button
                type="button"
                className="gp-mono text-xs gp-text-phosphor"
                onClick={() => onChange({ ...formData, details: [...formData.details, { key: '', value: '' }] })}
              >
                + Agregar campo
              </button>
            </div>
            {formData.details.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  className={inputClass}
                  placeholder="Nombre del campo"
                  value={item.key}
                  onChange={(e) => {
                    const next = [...formData.details];
                    next[idx] = { ...next[idx], key: e.target.value };
                    onChange({ ...formData, details: next });
                  }}
                />
                <Input
                  className={inputClass}
                  placeholder="Valor"
                  value={item.value}
                  onChange={(e) => {
                    const next = [...formData.details];
                    next[idx] = { ...next[idx], value: e.target.value };
                    onChange({ ...formData, details: next });
                  }}
                />
                <button
                  type="button"
                  className="gp-mono px-2 text-xs text-[var(--gp-error)]"
                  onClick={() => onChange({ ...formData, details: formData.details.filter((_, i) => i !== idx) })}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </PrimeScrollableModal>
  );
}
