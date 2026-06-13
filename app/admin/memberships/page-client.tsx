'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMemberships, type MembershipPlan } from '@/hooks/use-memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CreditCard, Trash2, Plus, X, Pencil } from 'lucide-react';

const DEFAULT_FORM: Omit<MembershipPlan, 'id' | 'createdAt'> = {
  name: 'Básica',
  price: 0,
  description: '',
  features: [''],
  durationDays: 30,
  color: 'blue',
};

export default function MembershipsPage() {
  const { plans, createPlan, updatePlan, deletePlan } = useMemberships();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<MembershipPlan, 'id' | 'createdAt'>>(DEFAULT_FORM);

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(DEFAULT_FORM);
    setIsOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
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

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleFeatureChange = (idx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === idx ? value : f)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.description) return;

    const payload = {
      name: formData.name,
      price: formData.price,
      description: formData.description,
      features: formData.features.filter(f => f.trim()),
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
    } catch {
      toast.error(editingPlan ? 'No se pudo actualizar el plan' : 'No se pudo crear el plan');
    } finally {
      setIsSaving(false);
    }
  };

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
  };

  return (
    <div className="px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Planes de Membresía</h1>
            <p className="text-lg text-muted-foreground">Gestiona los planes disponibles</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg gap-2"
          >
            <Plus className="h-5 w-5" />
            Crear Plan
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="group rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-secondary/40 hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${colorMap[plan.color]} p-3 text-white mb-4`}>
                <CreditCard className="h-6 w-6" />
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground ml-2">/{plan.durationDays} días</span>
              </div>

              <p className="text-muted-foreground mb-6 text-sm">{plan.description}</p>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openEdit(plan)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar Plan
                </Button>
                <Button
                  onClick={() => setPendingDeleteId(plan.id)}
                  variant="destructive"
                  className="w-full gap-2"
                >
                <Trash2 className="h-4 w-4" />
                Eliminar Plan
                </Button>
              </div>
            </div>
          ))}
        </div>

        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl border border-secondary/20 w-full max-w-md max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar formulario"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nombre</label>
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value as typeof formData.name }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option>Básica</option>
                    <option>Premium</option>
                    <option>Pro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Precio</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    placeholder="29.99"
                    className="h-10 bg-card border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe este plan..."
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus-visible:ring-2 focus-visible:ring-primary resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Duración (días)</label>
                  <Input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                    className="h-10 bg-card border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value as typeof formData.color }))}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="blue">Azul</option>
                    <option value="purple">Púrpura</option>
                    <option value="amber">Ámbar</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Características</label>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="text-primary hover:text-secondary text-sm font-medium"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          placeholder={`Característica ${idx + 1}`}
                          className="h-9 bg-card border-border flex-1"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-destructive hover:text-red-600"
                            aria-label={`Eliminar característica ${idx + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                >
                  {isSaving
                    ? 'Guardando…'
                    : editingPlan
                      ? 'Guardar cambios'
                      : 'Crear Plan'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Eliminar plan de membresía"
        description="¿Eliminar este plan? Los atletas con esta membresía activa no se verán afectados hasta su renovación."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) {
            deletePlan(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}
