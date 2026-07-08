'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollableModal } from '@/components/ui/scrollable-modal';
import { PrimeScrollableModal } from '@/components/admin-v2/prime-scrollable-modal';
import { cn } from '@/lib/utils';

interface CreateTrainerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  }) => Promise<void>;
  prime?: boolean;
}

export function CreateTrainerModal({
  open,
  onClose,
  onSubmit,
  prime = false,
}: CreateTrainerModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Completa email, nombre y apellido');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        specialization: specialization.trim() || undefined,
      });
      setEmail('');
      setFirstName('');
      setLastName('');
      setSpecialization('');
      onClose();
    } catch {
      setError('No se pudo enviar la invitación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = prime
    ? 'gp-mono mb-1.5 block text-xs uppercase gp-text-dim'
    : 'text-sm font-medium mb-2 block';
  const inputClass = prime
    ? 'gp-mono h-9 gp-border-outline gp-bg-surface-high gp-text-primary'
    : undefined;

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className={cn('text-sm', prime ? 'text-[#ffb4ab]' : 'text-destructive')} role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="trainer-email" className={labelClass}>
          Email personal
        </label>
        <Input
          id="trainer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="entrenador@ejemplo.com"
          required
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trainer-first-name" className={labelClass}>
            Nombre
          </label>
          <Input
            id="trainer-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trainer-last-name" className={labelClass}>
            Apellido
          </label>
          <Input
            id="trainer-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="trainer-specialization" className={labelClass}>
          Especialización (opcional)
        </label>
        <Input
          id="trainer-specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Fuerza, HIIT, Nutrición..."
          className={inputClass}
        />
      </div>
      <p className={cn('text-sm', prime ? 'gp-mono gp-text-muted' : 'text-muted-foreground')}>
        Se enviará un correo de Be a Gainer con un enlace para que el entrenador active su cuenta y defina su contraseña.
      </p>
    </form>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
        className={
          prime
            ? 'gp-mono gp-border-outline gp-bg-surface-high gp-text-muted hover:gp-text-phosphor'
            : undefined
        }
      >
        Cancelar
      </Button>
      <Button
        type="button"
        onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
        disabled={isSubmitting}
        className={
          prime
            ? 'gp-mono rounded-full bg-[var(--gp-phosphor)] font-bold text-[#003906] hover:bg-[var(--gp-phosphor-bright)]'
            : 'bg-gradient-to-r from-primary to-secondary'
        }
      >
        {isSubmitting ? 'Enviando...' : 'Enviar invitación'}
      </Button>
    </div>
  );

  if (prime) {
    return (
      <PrimeScrollableModal
        title="Invitar entrenador"
        modId="21"
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
    <ScrollableModal title="Invitar entrenador" onClose={onClose} footer={footer} size="md">
      {formBody}
    </ScrollableModal>
  );
}
