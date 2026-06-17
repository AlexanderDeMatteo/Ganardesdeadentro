'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { HudPanel } from '@/components/admin-v3/hud-panel';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | 'unassigned' | 'basic' | 'premium' | 'pro';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'TODOS' },
  { key: 'unassigned', label: 'SIN_TRAINER' },
  { key: 'basic', label: 'BASIC' },
  { key: 'premium', label: 'PREMIUM' },
  { key: 'pro', label: 'PRO' },
];

export default function AdminV3AthletesPage() {
  const searchParams = useSearchParams();
  const initialAthleteId = searchParams.get('athlete');
  const {
    athletes,
    assignableTrainers,
    assignTrainerToAthlete,
    updateAthlete,
    getTrainerById,
    isLoading,
  } = useAdmin();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialAthleteId);
  const [assignTrainerId, setAssignTrainerId] = useState('');
  const [editName, setEditName] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (filter === 'unassigned') return !a.trainerId;
      if (filter === 'basic' || filter === 'premium' || filter === 'pro') {
        return a.membershipLevel === filter;
      }
      return true;
    });
  }, [athletes, filter]);

  const selectedAthlete = useMemo(() => {
    const a = athletes.find((x) => x.id === selectedId) ?? null;
    if (a && editName === '' && selectedId === a.id) {
      return a;
    }
    return a;
  }, [athletes, selectedId, editName]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const athlete = athletes.find((a) => a.id === id);
    setEditName(athlete?.name ?? '');
    setAssignTrainerId('');
  }, [athletes]);

  const handleAssign = useCallback(async () => {
    if (!selectedAthlete || !assignTrainerId) return;
    setIsAssigning(true);
    try {
      await assignTrainerToAthlete(selectedAthlete.id, assignTrainerId);
      toast.success('Entrenador asignado');
      setAssignTrainerId('');
    } catch {
      toast.error('No se pudo asignar');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedAthlete, assignTrainerId, assignTrainerToAthlete]);

  const handleSaveName = useCallback(async () => {
    if (!selectedAthlete || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateAthlete(selectedAthlete.id, { name: editName.trim() });
      toast.success('Atleta actualizado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [selectedAthlete, editName, updateAthlete]);

  if (isLoading) {
    return <Skeleton className="h-96 rounded bg-[#19211d]/50" />;
  }

  const trainer = selectedAthlete?.trainerId
    ? getTrainerById(selectedAthlete.trainerId)
    : undefined;

  return (
    <div className="space-y-4">
      <header className="text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#68ca62]">[ ATLETAS ]</p>
      </header>

      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'border px-3 py-1 text-[10px] uppercase transition-colors',
              filter === f.key
                ? 'border-[#68ca62] bg-[#68ca62]/15 text-[#68ca62]'
                : 'border-[#68ca62]/20 text-[#8fa88a] hover:border-[#68ca62]/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <HudPanel title="REGISTRO" subtitle={`${filteredAthletes.length} UNIDADES`}>
            <ul className="max-h-[480px] space-y-1 overflow-y-auto">
              {filteredAthletes.map((athlete) => (
                <li key={athlete.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(athlete.id)}
                    className={cn(
                      'w-full border-l-2 px-2 py-2 text-left text-xs transition-colors',
                      selectedId === athlete.id
                        ? 'border-[#68ca62] bg-[#68ca62]/10 text-[#dce5de]'
                        : 'border-transparent text-[#8fa88a] hover:border-[#68ca62]/40 hover:text-[#dce5de]',
                    )}
                  >
                    {athlete.name}
                    {!athlete.trainerId ? (
                      <span className="ml-2 text-[#ffb4ab]">!</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </HudPanel>
        </div>

        <div className="lg:col-span-5">
          <HudPanel title="FICHA_UNIDAD" subtitle={selectedAthlete?.id.slice(0, 8) ?? '—'}>
            {selectedAthlete ? (
              <dl className="space-y-3 text-xs">
                {[
                  ['NOMBRE', selectedAthlete.name],
                  ['EMAIL', selectedAthlete.email],
                  ['MEMBRESÍA', selectedAthlete.membershipLevel],
                  ['ENTRENADOR', trainer?.name ?? 'SIN_ASIGNAR'],
                  ['PESO', `${selectedAthlete.weight} kg`],
                  ['ALTURA', `${selectedAthlete.height} cm`],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-[#68ca62]/10 py-2">
                    <dt className="uppercase text-[#8fa88a]">{key} {'//'}</dt>
                    <dd className="text-[#dce5de] capitalize">{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="py-12 text-center text-xs text-[#8fa88a]">
                Selecciona una unidad del registro
              </p>
            )}
          </HudPanel>
        </div>

        <div className="lg:col-span-4">
          <HudPanel title="ACCIONES_RÁPIDAS">
            {selectedAthlete ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-[#8fa88a]">EDITAR_NOMBRE</label>
                  <Input
                    value={editName || selectedAthlete.name}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 border-[#68ca62]/30 bg-[#0a0d0b]/60 font-mono text-xs text-[#dce5de]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-full border-[#68ca62]/40 text-[10px] uppercase text-[#68ca62]"
                    disabled={isSaving}
                    onClick={() => void handleSaveName()}
                  >
                    {isSaving ? 'Guardando…' : 'Guardar'}
                  </Button>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-[#8fa88a]">ASIGNAR_TRAINER</label>
                  <Select value={assignTrainerId} onValueChange={setAssignTrainerId}>
                    <SelectTrigger className="mt-1 border-[#68ca62]/30 bg-[#0a0d0b]/60 font-mono text-xs text-[#dce5de]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableTrainers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    className="mt-2 w-full bg-[#68ca62] text-[10px] font-bold uppercase text-[#003906] hover:bg-[#83e77b]"
                    disabled={!assignTrainerId || isAssigning}
                    onClick={() => void handleAssign()}
                  >
                    {isAssigning ? 'Asignando…' : 'Ejecutar asignación'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-[#8fa88a]">Sin unidad seleccionada</p>
            )}
          </HudPanel>
        </div>
      </div>
    </div>
  );
}
