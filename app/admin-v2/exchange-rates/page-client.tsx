'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeExchangeRateForm } from '@/components/admin-v2/prime-exchange-rate-form';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import type { ExchangeRate } from '@/lib/api/contracts/exchange-rates';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const EMPTY_FORM: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'> = {
  fromCurrency: 'USD',
  toCurrency: 'VES',
  rate: 0,
  label: '',
  isActive: true,
};

export default function AdminV2ExchangeRatesPage() {
  const { rates, isLoading, createRate, updateRate, deleteRate } = useExchangeRates();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ExchangeRate | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (rate: ExchangeRate) => {
    setEditing(rate);
    setFormData({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      label: rate.label,
      isActive: rate.isActive,
    });
    setIsOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await updateRate(editing.id, formData);
        toast.success('Tasa actualizada');
      } else {
        await createRate(formData);
        toast.success('Tasa creada');
      }
      setIsOpen(false);
    } catch {
      toast.error('No se pudo guardar la tasa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRate(id);
      toast.success('Tasa desactivada');
    } catch {
      toast.error('No se pudo desactivar');
    }
  };

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Tasas de cambio"
        subtitle="Gestiona conversiones disponibles para métodos locales"
        action={
          <PrimeChamferButton type="button" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Agregar tasa
          </PrimeChamferButton>
        }
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rates.map((rate) => (
            <PrimeModule key={rate.id} modId={`XR${rate.id}`} title={rate.label || `${rate.fromCurrency} → ${rate.toCurrency}`}>
              <div className="space-y-3 p-4">
                <p className="text-sm gp-text-muted">1 {rate.fromCurrency} = {rate.rate.toFixed(2)} {rate.toCurrency}</p>
                <div className="flex gap-2">
                  <PrimeChamferButton type="button" className="text-xs" onClick={() => openEdit(rate)}>
                    <Pencil className="size-3" aria-hidden />
                    Editar
                  </PrimeChamferButton>
                  <button type="button" className="gp-mono text-xs text-[var(--gp-error)]" onClick={() => void handleDelete(rate.id)}>
                    <Trash2 className="mr-1 inline size-3" aria-hidden />
                    Desactivar
                  </button>
                </div>
              </div>
            </PrimeModule>
          ))}
        </div>
      )}

      <PrimeExchangeRateForm
        open={isOpen}
        editingRate={editing}
        formData={formData}
        isSaving={isSaving}
        onChange={setFormData}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
