'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface CreateTrainerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  }) => Promise<void>;
}

export function CreateTrainerModal({ open, onClose, onSubmit }: CreateTrainerModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-secondary/20 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary/20 px-8 py-6">
          <h2 className="text-2xl font-bold">Invitar entrenador</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 border-secondary/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="trainer-email" className="text-sm font-medium mb-2 block">
              Email personal
            </label>
            <Input
              id="trainer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="entrenador@ejemplo.com"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="trainer-first-name" className="text-sm font-medium mb-2 block">
                Nombre
              </label>
              <Input
                id="trainer-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="trainer-last-name" className="text-sm font-medium mb-2 block">
                Apellido
              </label>
              <Input
                id="trainer-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="trainer-specialization" className="text-sm font-medium mb-2 block">
              Especialización (opcional)
            </label>
            <Input
              id="trainer-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="Fuerza, HIIT, Nutrición..."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Se enviará un correo con un enlace para que el entrenador active su cuenta y defina su contraseña.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-secondary">
              {isSubmitting ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
