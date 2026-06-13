'use client';

import { useState, useEffect } from 'react';
import { useTrainer } from '@/hooks/use-trainer';
import { useAuth } from '@/app/context/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Award, Mail, Calendar } from 'lucide-react';

export default function TrainerProfilePage() {
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
    <div className="mx-auto max-w-2xl space-y-8 px-8 py-12">
      <div>
        <h1 className="mb-2 text-5xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-lg text-muted-foreground">
          Información profesional visible para la plataforma
        </p>
      </div>

      <div className="rounded-2xl border border-secondary/20 bg-card p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-black text-primary-foreground">
            {user?.first_name?.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user?.email}
            </p>
          </div>
        </div>

        {trainerInfo && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-bold">{trainerInfo.rating} / 5</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-secondary/10 p-4">
              <Calendar className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">Desde</p>
                <p className="font-bold">
                  {new Date(trainerInfo.joinDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="specialization" className="text-xs font-extrabold uppercase tracking-wider">
            Especialización
          </label>
          <Input
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-xs font-extrabold uppercase tracking-wider">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
