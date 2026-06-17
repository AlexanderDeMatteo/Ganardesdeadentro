'use client';

import { useEffect, useState } from 'react';
import { AthleteProfile } from '@/hooks/use-admin';
import { useMemberships } from '@/hooks/use-memberships';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollableModal } from '@/components/ui/scrollable-modal';

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
  prime?: boolean;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function EditAthleteModal({ athlete, onClose, onSave, prime = false }: EditAthleteModalProps) {
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

  const labelClass = prime
    ? 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim'
    : 'mb-2 block text-sm font-medium';
  const inputClass = prime ? 'gp-field gp-mono h-9 rounded-lg px-3 text-sm' : undefined;
  const selectClass = prime
    ? 'gp-field gp-mono h-9 w-full rounded-lg px-3 text-sm'
    : 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm';

  const formBody = (
    <form id="edit-athlete-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="edit-athlete-first-name">
            Nombre
          </label>
          <Input
            id="edit-athlete-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-athlete-last-name">
            Apellido
          </label>
          <Input
            id="edit-athlete-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="edit-athlete-email">
          Email
        </label>
        <Input
          id="edit-athlete-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="edit-athlete-plan">
          Plan de membresía
        </label>
        <select
          id="edit-athlete-plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className={selectClass}
        >
          <option value="">Sin cambio</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — ${plan.price}
            </option>
          ))}
        </select>
      </div>
    </form>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSaving}
        className={prime ? 'gp-btn-ghost gp-mono text-xs uppercase' : undefined}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="edit-athlete-form"
        disabled={isSaving}
        className={
          prime
            ? 'gp-btn-phosphor gp-mono text-xs uppercase'
            : undefined
        }
      >
        {isSaving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  );

  if (prime) {
    return (
      <PrimeScrollableModal
        title="Editar atleta"
        modId="14"
        onClose={onClose}
        footer={footer}
        size="wide"
        fitContent
      >
        {formBody}
      </PrimeScrollableModal>
    );
  }

  return (
    <ScrollableModal title="Editar atleta" onClose={onClose} footer={footer} size="md">
      {formBody}
    </ScrollableModal>
  );
}
