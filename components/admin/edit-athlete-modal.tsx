'use client';

import { useEffect, useState } from 'react';
import { AthleteProfile } from '@/hooks/use-admin';
import { useMemberships } from '@/hooks/use-memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface EditAthleteModalProps {
  athlete: AthleteProfile | null;
  onClose: () => void;
  onSave: (payload: {
    athleteId: string;
    firstName: string;
    lastName: string;
    email: string;
    planId?: string;
  }) => Promise<void>;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function EditAthleteModal({ athlete, onClose, onSave }: EditAthleteModalProps) {
  const { plans } = useMemberships();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!athlete) return;
    const { firstName: fn, lastName: ln } = splitName(athlete.name);
    setFirstName(fn);
    setLastName(ln);
    setEmail(athlete.email);
    setPlanId(athlete.membershipId ?? '');
  }, [athlete]);

  if (!athlete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        athleteId: athlete.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        planId: planId || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-secondary/20 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary/20 px-6 py-4">
          <h2 className="text-xl font-bold">Editar atleta</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Apellido</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Plan de membresía</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin cambio</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — ${plan.price}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
