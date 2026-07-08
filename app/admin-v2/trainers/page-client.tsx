'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateTrainerModal } from '@/components/admin/create-trainer-modal';
import { DeactivateTrainerModal } from '@/components/admin/deactivate-trainer-modal';
import { PrimeChamferButton } from '@/components/admin-v2/prime-chamfer-button';
import { PrimeFilterPills } from '@/components/admin-v2/prime-filter-pills';
import { PrimeKpiStrip } from '@/components/admin-v2/prime-kpi-strip';
import { PrimeModule } from '@/components/admin-v2/prime-module';
import { PrimePageHeader } from '@/components/admin-v2/prime-page-header';
import { PrimeTrainerInspector } from '@/components/admin-v2/prime-trainer-inspector';
import { PrimeTrainersGrid } from '@/components/admin-v2/prime-trainers-grid';
import { useAdmin, type Trainer } from '@/hooks/use-admin';
import { useIsBelowXl } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, UserPlus, Users } from 'lucide-react';

type FilterKey = 'all' | 'active' | 'pending' | 'inactive';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'inactive', label: 'Inactivos' },
];

function matchesFilter(trainer: Trainer, filter: FilterKey): boolean {
  if (filter === 'active') return trainer.isActive !== false && !trainer.invitePending;
  if (filter === 'pending') return Boolean(trainer.invitePending);
  if (filter === 'inactive') return trainer.isActive === false;
  return trainer.isActive !== false || Boolean(trainer.invitePending);
}

export default function AdminV2TrainersPage() {
  const isBelowXl = useIsBelowXl();
  const {
    athletes,
    trainers,
    createTrainer,
    deactivateTrainer,
    reactivateTrainer,
    resendTrainerInvite,
    isLoading,
  } = useAdmin();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Trainer | null>(null);
  const [isResendingId, setIsResendingId] = useState<string | null>(null);
  const [isReactivatingId, setIsReactivatingId] = useState<string | null>(null);

  const visibleTrainers = useMemo(
    () => trainers.filter((t) => t.isActive !== false || t.invitePending),
    [trainers],
  );

  const activeTrainers = useMemo(
    () => visibleTrainers.filter((t) => t.isActive !== false && !t.invitePending),
    [visibleTrainers],
  );

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = filter === 'inactive' ? trainers : visibleTrainers;
    return base.filter((t) => {
      if (!matchesFilter(t, filter)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    });
  }, [trainers, visibleTrainers, filter, search]);

  const selectedTrainer = useMemo(
    () => trainers.find((t) => t.id === selectedId) ?? null,
    [trainers, selectedId],
  );

  const avgRating =
    activeTrainers.length > 0
      ? (activeTrainers.reduce((sum, t) => sum + t.rating, 0) / activeTrainers.length).toFixed(1)
      : '0.0';

  const handleCreate = async (payload: {
    email: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  }) => {
    await createTrainer(payload);
    toast.success(`Invitación enviada a ${payload.email}`);
  };

  const handleResend = async () => {
    if (!selectedTrainer) return;
    setIsResendingId(selectedTrainer.id);
    try {
      await resendTrainerInvite(selectedTrainer.id);
      toast.success('Invitación reenviada');
    } catch {
      toast.error('No se pudo reenviar la invitación');
    } finally {
      setIsResendingId(null);
    }
  };

  const handleDeactivate = async (
    athleteActions: Array<{
      athleteId: string;
      action: 'reassign' | 'unassign';
      newTrainerId?: string;
    }>,
  ) => {
    if (!deactivateTarget) return;
    await deactivateTrainer(deactivateTarget.id, athleteActions);
    toast.success('Entrenador desactivado');
    setDeactivateTarget(null);
    if (selectedId === deactivateTarget.id) setSelectedId(null);
  };

  const handleReactivate = async () => {
    if (!selectedTrainer) return;
    setIsReactivatingId(selectedTrainer.id);
    try {
      await reactivateTrainer(selectedTrainer.id);
      toast.success('Entrenador reactivado');
    } catch {
      toast.error('No se pudo reactivar el entrenador');
    } finally {
      setIsReactivatingId(null);
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
        title="Entrenadores"
        subtitle="Invita, supervisa y gestiona la plantilla de entrenadores"
        action={
          <PrimeChamferButton onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Invitar entrenador
          </PrimeChamferButton>
        }
      />

      <PrimeKpiStrip
        items={[
          { label: 'Activos', value: activeTrainers.length, icon: Users },
          {
            label: 'Atletas asignados',
            value: activeTrainers.reduce((sum, t) => sum + t.athletes, 0),
            icon: Users,
          },
          { label: 'Rating promedio', value: avgRating, icon: Star },
        ]}
      />

      <PrimeModule modId="13" title="FILTROS_OPERATIVOS" className="overflow-hidden">
        <div className="p-4">
          <PrimeFilterPills filters={FILTERS} active={filter} onChange={setFilter} />
        </div>
      </PrimeModule>

      <div className="flex flex-col gap-6 xl:flex-row">
        <PrimeTrainersGrid
          trainers={filteredTrainers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          search={search}
          onSearchChange={setSearch}
        />

        <aside className="hidden min-w-0 shrink-0 xl:block xl:w-[360px]">
          {selectedTrainer ? (
            <PrimeTrainerInspector
              trainer={selectedTrainer}
              onResendInvite={() => void handleResend()}
              onDeactivate={() => setDeactivateTarget(selectedTrainer)}
              onReactivate={() => void handleReactivate()}
              isResending={isResendingId === selectedTrainer.id}
              isReactivating={isReactivatingId === selectedTrainer.id}
            />
          ) : (
            <div className="gp-module flex min-h-[200px] items-center justify-center rounded-lg p-8 lg:min-h-[360px]">
              <p className="gp-mono text-center text-sm gp-text-muted">
                Selecciona un entrenador del grid
              </p>
            </div>
          )}
        </aside>
      </div>

      <Sheet
        open={isBelowXl && Boolean(selectedTrainer)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto gp-bg-surface p-0">
          <SheetTitle className="sr-only">Detalle del entrenador</SheetTitle>
          {selectedTrainer ? (
            <PrimeTrainerInspector
              trainer={selectedTrainer}
              onResendInvite={() => void handleResend()}
              onDeactivate={() => setDeactivateTarget(selectedTrainer)}
              onReactivate={() => void handleReactivate()}
              isResending={isResendingId === selectedTrainer.id}
              isReactivating={isReactivatingId === selectedTrainer.id}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <CreateTrainerModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        prime
      />

      <DeactivateTrainerModal
        trainer={deactivateTarget}
        athletes={athletes}
        otherTrainers={activeTrainers.filter((t) => t.id !== deactivateTarget?.id)}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
        prime
      />
    </div>
  );
}
