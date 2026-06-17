'use client';

import { useState, useEffect } from 'react';
import { useTrainer } from '@/hooks/use-trainer';
import { useAuth } from '@/app/context/auth-context';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { Award, Calendar, Mail } from 'lucide-react';

export default function TrainerV2ProfilePageClient() {
  const { user } = useAuth();
  const { trainerInfo, profile, updateProfile } = useTrainer();
  const [specialization, setSpecialization] = useState(profile.specialization);
  const [bio, setBio] = useState(profile.bio);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSpecialization(profile.specialization);
    setBio(profile.bio);
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ specialization, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // toast handled in useTrainer
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PrimePageHeader
        title="Mi perfil"
        subtitle="Información profesional visible para la plataforma"
      />

      <PrimeModule modId="TRN-70" title="PERFIL_ENTRENADOR">
        <div className="space-y-6 p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="gp-chamfer flex h-16 w-16 items-center justify-center border gp-border-outline gp-bg-surface-variant text-2xl font-black gp-text-phosphor">
              {user?.first_name?.charAt(0)}
            </div>
            <div>
              <p className="gp-display text-xl gp-text-primary">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="gp-mono flex items-center gap-2 text-sm gp-text-muted">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
            </div>
          </div>

          {trainerInfo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded border gp-border-outline/40 gp-bg-surface-variant/20 p-4">
                <Award className="h-5 w-5 gp-text-phosphor" />
                <div>
                  <p className="gp-mono text-xs gp-text-dim">Rating</p>
                  <p className="gp-metric font-bold gp-text-primary">
                    {trainerInfo.rating} / 5
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded border gp-border-outline/40 gp-bg-surface-variant/20 p-4">
                <Calendar className="h-5 w-5 gp-text-phosphor" />
                <div>
                  <p className="gp-mono text-xs gp-text-dim">Desde</p>
                  <p className="gp-metric font-bold gp-text-primary">
                    {new Date(trainerInfo.joinDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="specialization" className="gp-label gp-text-dim">
              Especialización
            </label>
            <input
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="gp-mono h-11 w-full rounded border gp-border-outline gp-bg-surface-variant px-3 text-sm gp-text-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="gp-label gp-text-dim">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="gp-mono w-full rounded border gp-border-outline gp-bg-surface-variant px-3 py-2 text-sm gp-text-primary"
            />
          </div>

          <PrimeChamferButton onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </PrimeChamferButton>
        </div>
      </PrimeModule>
    </div>
  );
}
