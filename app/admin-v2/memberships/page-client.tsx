'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimeMembershipPlanForm } from '@/components/admin-v2/prime-membership-plan-form';
import { PrimeMembershipPlansGrid } from '@/components/admin-v2/prime-membership-plan-card';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { useMemberships, type MembershipPlan } from '@/hooks/use-memberships';
import { ApiError } from '@/lib/api/errors';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Plus, Star } from 'lucide-react';

const DEFAULT_FORM: Omit<MembershipPlan, 'id' | 'createdAt'> = {
  name: '',
  functionalTier: 'basic',
  price: 0,
  description: '',
  features: [''],
  durationDays: 30,
  color: 'blue',
};

export default function AdminV2MembershipsPage() {
  const { plans, createPlan, updatePlan, deletePlan, isLoading } = useMemberships();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<MembershipPlan, 'id' | 'createdAt'>>(DEFAULT_FORM);

  const basicCount = plans.filter((p) => p.functionalTier === 'basic').length;
  const premiumProCount = plans.filter(
    (p) => p.functionalTier === 'premium' || p.functionalTier === 'pro',
  ).length;

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(DEFAULT_FORM);
    setIsOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      functionalTier: plan.functionalTier,
      price: plan.price,
      description: plan.description,
      features: plan.features.length > 0 ? plan.features : [''],
      durationDays: plan.durationDays,
      color: plan.color,
    });
    setIsOpen(true);
  };

  const closeForm = () => {
    setIsOpen(false);
    setEditingPlan(null);
    setFormData(DEFAULT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName || !formData.price || !formData.description) {
      toast.error('Completa nombre, precio y descripción');
      return;
    }
    if (trimmedName.length > 120) {
      toast.error('El nombre no puede superar 120 caracteres');
      return;
    }

    const payload = {
      name: trimmedName,
      functionalTier: formData.functionalTier,
      price: formData.price,
      description: formData.description,
      features: formData.features.filter((f) => f.trim()),
      durationDays: formData.durationDays,
      color: formData.color,
    };

    setIsSaving(true);
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
        toast.success('Plan actualizado');
      } else {
        await createPlan(payload);
        toast.success('Plan creado');
      }
      closeForm();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        toast.error(err.message || 'Ya existe un plan con ese nombre');
      } else {
        toast.error(editingPlan ? 'No se pudo actualizar el plan' : 'No se pudo crear el plan');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg gp-bg-surface-high" />
        <Skeleton className="h-96 rounded-lg gp-bg-surface-high" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrimePageHeader
        title="Membresías"
        subtitle="Gestiona los planes disponibles para atletas"
        action={
          <PrimeChamferButton onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Crear plan
          </PrimeChamferButton>
        }
      />

      <PrimeKpiStrip
        items={[
          { label: 'Total planes', value: plans.length, icon: CreditCard },
          { label: 'Basic', value: basicCount, icon: Star },
          { label: 'Premium + Pro', value: premiumProCount, icon: Star },
        ]}
      />

      <PrimeMembershipPlansGrid
        plans={plans}
        onEdit={openEdit}
        onDelete={setPendingDeleteId}
      />

      <PrimeMembershipPlanForm
        open={isOpen}
        editingPlan={editingPlan}
        formData={formData}
        isSaving={isSaving}
        onChange={setFormData}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onAddFeature={() =>
          setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }))
        }
        onRemoveFeature={(idx) =>
          setFormData((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== idx),
          }))
        }
        onFeatureChange={(idx, value) =>
          setFormData((prev) => ({
            ...prev,
            features: prev.features.map((f, i) => (i === idx ? value : f)),
          }))
        }
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Eliminar plan de membresía"
        description="¿Eliminar este plan? Los atletas con esta membresía activa no se verán afectados hasta su renovación."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) {
            void deletePlan(pendingDeleteId);
            setPendingDeleteId(null);
            toast.success('Plan eliminado');
          }
        }}
      />
    </div>
  );
}
