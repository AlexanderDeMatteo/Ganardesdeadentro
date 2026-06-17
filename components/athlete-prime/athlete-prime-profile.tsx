'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { useAuth } from '@/app/context/auth-context';
import { getAuthClient } from '@/lib/auth/auth-client';
import { MyTrainerCard } from '@/components/dashboard/my-trainer-card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBodyProfile } from '@/hooks/use-body-profile';
import { useAthleteData } from '@/hooks/use-athlete-data';
import { useMetrics } from '@/hooks/use-metrics';
import type { BiologicalSex, BodyProfile } from '@/lib/body-profile';
import { User, Mail, Ruler } from 'lucide-react';
import { toast } from 'sonner';

export function AthletePrimeProfile() {
  const { user, refreshSession } = useAuth();
  const { profile, isLoaded, setProfile } = useBodyProfile();
  const { completedSessionsCount, isLoading: athleteLoading } = useAthleteData();
  const { getLatestEntry } = useMetrics();
  const latestMetric = getLatestEntry();
  const [firstNameDraft, setFirstNameDraft] = useState('');
  const [lastNameDraft, setLastNameDraft] = useState('');
  const [heightDraft, setHeightDraft] = useState('');
  const [ageDraft, setAgeDraft] = useState('');
  const [sexDraft, setSexDraft] = useState<'' | BiologicalSex>('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstNameDraft(user.first_name ?? '');
    setLastNameDraft(user.last_name ?? '');
  }, [user?.first_name, user?.last_name, user]);

  useEffect(() => {
    if (!isLoaded) return;
    setHeightDraft(profile.heightCm != null ? String(profile.heightCm) : '');
    setAgeDraft(profile.age != null ? String(profile.age) : '');
    setSexDraft(profile.sex ?? '');
  }, [isLoaded, profile.heightCm, profile.age, profile.sex]);

  const handleSaveBodyProfile = async () => {
    const h = parseFloat(heightDraft.replace(',', '.'));
    const a = parseInt(ageDraft, 10);
    const next: BodyProfile = {
      heightCm: Number.isFinite(h) && h >= 50 && h <= 260 ? h : undefined,
      age: Number.isFinite(a) && a >= 18 && a <= 120 ? a : undefined,
      sex: sexDraft === 'male' || sexDraft === 'female' ? sexDraft : undefined,
    };
    setIsSavingProfile(true);
    try {
      await setProfile(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      toast.error('No se pudo guardar el perfil corporal');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveIdentity = async () => {
    if (!firstNameDraft.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSavingIdentity(true);
    try {
      await getAuthClient().updateProfile({
        first_name: firstNameDraft.trim(),
        last_name: lastNameDraft.trim(),
      });
      await refreshSession();
      toast.success('Perfil actualizado');
    } catch {
      toast.error('No se pudo actualizar el perfil');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setIsChangingPassword(true);
    try {
      await getAuthClient().changePassword(oldPassword, newPassword);
      toast.success('Contraseña actualizada');
      setPasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('No se pudo cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PrimePageHeader
        title="Mi Perfil"
        subtitle="Administra tu información personal y datos corporales"
      />

      <PrimeModule modId="P01" title="IDENTIDAD">
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-6 border-b gp-border-outline pb-6">
            <div className="flex size-20 items-center justify-center rounded-full gp-bg-surface-variant text-3xl font-bold gp-text-phosphor">
              {user?.first_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="gp-display text-2xl gp-text-primary">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="gp-mono text-sm capitalize gp-text-muted">{user?.role}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="gp-label flex items-center gap-2 gp-text-muted">
                <User className="size-4 gp-text-phosphor" aria-hidden />
                Nombre
              </label>
              <Input
                type="text"
                value={firstNameDraft}
                onChange={(e) => setFirstNameDraft(e.target.value)}
                className="gp-field h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="gp-label flex items-center gap-2 gp-text-muted">
                <User className="size-4 gp-text-phosphor" aria-hidden />
                Apellido
              </label>
              <Input
                type="text"
                value={lastNameDraft}
                onChange={(e) => setLastNameDraft(e.target.value)}
                className="gp-field h-11"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <PrimeChamferButton
              type="button"
              disabled={isSavingIdentity}
              onClick={() => void handleSaveIdentity()}
            >
              {isSavingIdentity ? 'Guardando…' : 'Guardar nombre'}
            </PrimeChamferButton>
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="gp-mono rounded border gp-border-outline px-4 py-2 text-sm gp-text-muted transition-colors hover:gp-text-phosphor"
            >
              Cambiar contraseña
            </button>
          </div>

          <div className="space-y-2">
            <label className="gp-label flex items-center gap-2 gp-text-muted">
              <Mail className="size-4" aria-hidden />
              Correo electrónico
            </label>
            <Input type="email" value={user?.email || ''} readOnly className="gp-field h-11 opacity-70" />
          </div>
        </div>
      </PrimeModule>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="gp-module gp-border-outline gp-bg-surface">
          <DialogHeader>
            <DialogTitle className="gp-text-primary">Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="gp-label mb-2 block gp-text-muted">Contraseña actual</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                className="gp-field"
              />
            </div>
            <div>
              <label className="gp-label mb-2 block gp-text-muted">Nueva contraseña</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="gp-field"
              />
            </div>
            <div>
              <label className="gp-label mb-2 block gp-text-muted">Confirmar contraseña</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="gp-field"
              />
            </div>
            <PrimeChamferButton
              type="button"
              className="w-full"
              disabled={isChangingPassword}
              onClick={() => void handleChangePassword()}
            >
              {isChangingPassword ? 'Guardando…' : 'Actualizar contraseña'}
            </PrimeChamferButton>
          </div>
        </DialogContent>
      </Dialog>

      <PrimeModule modId="P02" title="DATOS_CORPORALES">
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-2">
            <Ruler className="size-5 gp-text-phosphor" aria-hidden />
            <p className="gp-label gp-text-muted">Datos para estimaciones</p>
          </div>
          <p className="text-sm gp-text-muted leading-relaxed">
            FitTrack puede estimar un porcentaje orientativo de grasa corporal a partir de tu peso y estos
            datos. <strong className="gp-text-primary">No sustituye</strong> una medición profesional.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="profile-height" className="gp-label gp-text-muted">
                Talla (cm)
              </label>
              <Input
                id="profile-height"
                type="number"
                min={50}
                max={260}
                step="0.1"
                placeholder="175"
                value={heightDraft}
                onChange={(e) => setHeightDraft(e.target.value)}
                className="gp-field h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-age" className="gp-label gp-text-muted">
                Edad (años)
              </label>
              <Input
                id="profile-age"
                type="number"
                min={18}
                max={120}
                placeholder="30"
                value={ageDraft}
                onChange={(e) => setAgeDraft(e.target.value)}
                className="gp-field h-11"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="profile-sex" className="gp-label gp-text-muted">
                Sexo (para la fórmula de estimación)
              </label>
              <select
                id="profile-sex"
                value={sexDraft}
                onChange={(e) => setSexDraft(e.target.value as '' | BiologicalSex)}
                className="gp-field h-11 w-full max-w-md rounded-md px-3 text-sm"
              >
                <option value="">Seleccionar…</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimeChamferButton
              type="button"
              disabled={isSavingProfile}
              onClick={() => void handleSaveBodyProfile()}
            >
              {isSavingProfile ? 'Guardando…' : 'Guardar datos corporales'}
            </PrimeChamferButton>
            {savedFlash && (
              <span className="text-sm font-medium gp-text-phosphor">Guardado</span>
            )}
          </div>
          <p className="text-xs gp-text-dim">
            Luego, en{' '}
            <Link href="/metrics" className="gp-text-phosphor underline-offset-4 hover:underline">
              Métricas
            </Link>
            , podrás usar &quot;Estimar a partir de mi perfil&quot;.
          </p>
        </div>
      </PrimeModule>

      <PrimeModule modId="P03" title="ESTADISTICAS">
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="rounded-lg border gp-border-outline gp-bg-surface-variant p-4">
            <p className="gp-label gp-text-muted">Entrenamientos completados</p>
            <p className="gp-metric mt-2 text-3xl gp-text-primary">
              {athleteLoading ? '—' : completedSessionsCount}
            </p>
          </div>
          <div className="rounded-lg border gp-border-outline gp-bg-surface-variant p-4">
            <p className="gp-label gp-text-muted">Peso actual</p>
            <p className="gp-metric mt-2 text-3xl gp-text-primary">
              {latestMetric?.weight != null ? `${latestMetric.weight} kg` : '—'}
            </p>
          </div>
          {user?.membership && (
            <div className="col-span-full rounded-lg border gp-border-outline p-4">
              <p className="gp-label gp-text-muted">Membresía</p>
              <p className="gp-text-primary">
                {user.membership.name} · {user.membership.daysRemaining} días restantes
              </p>
            </div>
          )}
        </div>
      </PrimeModule>

      <MyTrainerCard />
    </div>
  );
}
