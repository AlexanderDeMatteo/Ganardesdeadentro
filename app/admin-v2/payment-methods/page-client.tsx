'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimePaymentMethodForm } from '@/components/admin-v2/prime-payment-method-form';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type FormState = {
  name: string;
  category: string;
  methodType: 'digital' | 'bank' | 'crypto' | 'cash';
  exchangeRateId: string | null;
  details: Array<{ key: string; value: string }>;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: '',
  category: '',
  methodType: 'digital',
  exchangeRateId: null,
  details: [{ key: '', value: '' }],
  sortOrder: 0,
  isActive: true,
};

export default function AdminV2PaymentMethodsPage() {
  const { rates } = useExchangeRates(true);
  const { methods, isLoading, createMethod, updateMethod, deleteMethod } = usePaymentMethods();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setIsOpen(true);
  };

  const openEdit = (id: string) => {
    const method = methods.find((m) => m.id === id);
    if (!method) return;
    setEditingId(id);
    setForm({
      name: method.name,
      category: method.category,
      methodType: method.methodType ?? 'digital',
      exchangeRateId: method.exchangeRateId ?? null,
      details: method.details?.length ? method.details : [{ key: '', value: '' }],
      sortOrder: method.sortOrder ?? 0,
      isActive: method.isActive,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if ((form.methodType === 'digital' || form.methodType === 'bank') && !form.details.some((d) => d.key && d.value)) {
      toast.error('Agrega al menos un detalle del método');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateMethod(editingId, form);
        toast.success('Método actualizado');
      } else {
        await createMethod(form);
        toast.success('Método creado');
      }
      setIsOpen(false);
    } catch {
      toast.error('No se pudo guardar el método');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMethod(deleteId);
      toast.success('Método desactivado');
    } catch {
      toast.error('No se pudo eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Métodos de Pago"
        subtitle="Configura las opciones de cobro visibles para los atletas"
        action={
          <PrimeChamferButton type="button" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Nuevo método
          </PrimeChamferButton>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {methods.map((method) => (
            <PrimeModule key={method.id} modId={`PM${method.id}`} title={method.name}>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2 gp-text-phosphor">
                  <CreditCard className="size-5" aria-hidden />
                  <span className="text-sm gp-text-muted">{method.category} · {method.methodType}</span>
                </div>
                {method.exchangeRate ? (
                  <p className="text-xs gp-text-muted">
                    Tasa: 1 {method.exchangeRate.fromCurrency} = {method.exchangeRate.rate.toFixed(2)} {method.exchangeRate.toCurrency}
                  </p>
                ) : null}
                <div className="space-y-1 text-xs gp-text-muted">
                  {method.details?.slice(0, 3).map((detail, idx) => (
                    <p key={idx}>{detail.key}: {detail.value}</p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <PrimeChamferButton type="button" className="text-xs" onClick={() => openEdit(method.id)}>
                    <Pencil className="size-3" aria-hidden />
                    Editar
                  </PrimeChamferButton>
                  <button
                    type="button"
                    onClick={() => setDeleteId(method.id)}
                    className="gp-mono inline-flex items-center gap-1 rounded px-3 py-2 text-xs text-[var(--gp-error)]"
                  >
                    <Trash2 className="size-3" aria-hidden />
                    Desactivar
                  </button>
                </div>
              </div>
            </PrimeModule>
          ))}
        </div>
      )}

      <PrimePaymentMethodForm
        open={isOpen}
        isSaving={saving}
        editingId={editingId}
        formData={form}
        exchangeRates={rates}
        onChange={setForm}
        onClose={() => setIsOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Desactivar método"
        description="El método dejará de mostrarse a los atletas."
        confirmLabel="Desactivar"
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
