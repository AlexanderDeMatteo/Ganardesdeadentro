'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/app/context/auth-context';
import { MyTrainerCard } from '@/components/dashboard/my-trainer-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBodyProfile } from '@/hooks/use-body-profile';
import { useAthleteData } from '@/hooks/use-athlete-data';
import type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
import { User, Mail, Ruler } from 'lucide-react';

function ProfileContent() {
  const { user } = useAuth();
  const { profile, isLoaded, setProfile } = useBodyProfile();
  const { completedSessionsCount, latestMetric, isLoading: athleteLoading } = useAthleteData();
  const [heightDraft, setHeightDraft] = useState('');
  const [ageDraft, setAgeDraft] = useState('');
  const [sexDraft, setSexDraft] = useState<'' | BiologicalSex>('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setHeightDraft(profile.heightCm != null ? String(profile.heightCm) : '');
    setAgeDraft(profile.age != null ? String(profile.age) : '');
    setSexDraft(profile.sex ?? '');
  }, [isLoaded, profile.heightCm, profile.age, profile.sex]);

  const handleSaveBodyProfile = () => {
    const h = parseFloat(heightDraft.replace(',', '.'));
    const a = parseInt(ageDraft, 10);
    const next: BodyProfile = {
      heightCm: Number.isFinite(h) && h >= 50 && h <= 260 ? h : undefined,
      age: Number.isFinite(a) && a >= 18 && a <= 120 ? a : undefined,
      sex: sexDraft === 'male' || sexDraft === 'female' ? sexDraft : undefined,
    };
    setProfile(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-lg text-muted-foreground">Administra tu información personal</p>
          </div>

          <div className="rounded-2xl border border-secondary/20 bg-gradient-to-br from-card to-card/50 p-8 backdrop-blur-sm space-y-8">
            {/* Profile Header */}
            <div className="flex items-center gap-6 pb-8 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                {user?.first_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Información Personal</h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <User className="h-4 w-4 text-primary" />
                    Nombre
                  </label>
                  <Input
                    type="text"
                    value={user?.first_name || ''}
                    readOnly
                    className="h-11 bg-background/50 border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <User className="h-4 w-4 text-secondary" />
                    Apellido
                  </label>
                  <Input
                    type="text"
                    value={user?.last_name || ''}
                    readOnly
                    className="h-11 bg-background/50 border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Mail className="h-4 w-4 text-accent" />
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div className="border-t border-border pt-8 space-y-6">
              <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-secondary" />
                <h3 className="text-xl font-bold text-foreground">Datos para estimaciones</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                FitTrack puede estimar un porcentaje orientativo de grasa corporal a partir de tu peso y estos
                datos (fórmula científica de referencia en adultos).{' '}
                <strong className="text-foreground">No sustituye</strong> una medición con báscula de bioimpedancia,
                pliegues o valoración de un profesional. Los resultados son aproximados.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="profile-height" className="text-sm font-medium text-foreground">
                    Talla (cm)
                  </label>
                  <Input
                    id="profile-height"
                    type="number"
                    min={50}
                    max={260}
                    step="0.1"
                    inputMode="decimal"
                    placeholder="175"
                    value={heightDraft}
                    onChange={(e) => setHeightDraft(e.target.value)}
                    className="h-11 bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-age" className="text-sm font-medium text-foreground">
                    Edad (años)
                  </label>
                  <Input
                    id="profile-age"
                    type="number"
                    min={18}
                    max={120}
                    step="1"
                    inputMode="numeric"
                    placeholder="30"
                    value={ageDraft}
                    onChange={(e) => setAgeDraft(e.target.value)}
                    className="h-11 bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="profile-sex" className="text-sm font-medium text-foreground">
                    Sexo (para la fórmula de estimación)
                  </label>
                  <select
                    id="profile-sex"
                    value={sexDraft}
                    onChange={(e) => setSexDraft(e.target.value as '' | BiologicalSex)}
                    className="h-11 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="">Seleccionar…</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleSaveBodyProfile} className="bg-gradient-to-r from-primary to-secondary">
                  Guardar datos corporales
                </Button>
                {savedFlash && (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Guardado</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Luego, en{' '}
                <Link href="/metrics" className="font-medium text-secondary underline-offset-4 hover:underline">
                  Métricas
                </Link>
                , podrás usar &quot;Estimar a partir de mi perfil&quot; si no tienes el % de una báscula.
              </p>
            </div>

            {/* Stats */}
            <div className="border-t border-border pt-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Estadísticas</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4 border border-secondary/20">
                  <p className="text-sm text-muted-foreground mb-2">Entrenamientos completados</p>
                  <p className="text-3xl font-bold text-foreground">
                    {athleteLoading ? '—' : completedSessionsCount}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 border border-orange-500/20">
                  <p className="text-sm text-muted-foreground mb-2">Peso actual</p>
                  <p className="text-3xl font-bold text-foreground">
                    {latestMetric?.weight != null ? `${latestMetric.weight} kg` : '—'}
                  </p>
                </div>
              </div>
              {user?.membership && (
                <div className="mt-4 rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">Membresía</p>
                  <p className="font-bold text-foreground">
                    {user.membership.name} · {user.membership.daysRemaining} días restantes
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-8">
              <MyTrainerCard />
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-8 space-y-4">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg">
                Editar Perfil
              </Button>
              <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10">
                Cambiar Contraseña
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
