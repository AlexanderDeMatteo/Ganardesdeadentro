'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  buildActionCommands,
  buildEntityCommands,
  buildNavCommands,
  filterCommandsByQuery,
  type AdminCommandItem,
} from '@/lib/admin-v2/admin-command-items';
import { useAdmin } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';

type PrimeCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const GROUP_LABELS: Record<AdminCommandItem['group'], string> = {
  navigation: 'Navegación',
  actions: 'Acciones rápidas',
  athletes: 'Atletas',
  trainers: 'Entrenadores',
};

function CommandGroupSection({
  heading,
  items,
  onSelect,
}: {
  heading: string;
  items: AdminCommandItem[];
  onSelect: (item: AdminCommandItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <CommandGroup
      heading={heading}
      className="[&_[cmdk-group-heading]]:gp-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[#899483]"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <CommandItem
            key={item.id}
            value={`${item.label} ${item.keywords}`}
            onSelect={() => onSelect(item)}
            className="gp-mono cursor-pointer rounded-md text-[#dce5de] aria-selected:bg-[#2e3732] aria-selected:text-[#83e77b] data-[selected=true]:bg-[#2e3732] data-[selected=true]:text-[#83e77b]"
          >
            {Icon ? <Icon className="h-4 w-4 text-[#becab8]" aria-hidden /> : null}
            <span>{item.label}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

export function PrimeCommandPalette({ open, onOpenChange }: PrimeCommandPaletteProps) {
  const router = useRouter();
  const { athletes, trainers } = useAdmin();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const navCommands = useMemo(
    () => filterCommandsByQuery(buildNavCommands(), search),
    [search],
  );
  const actionCommands = useMemo(
    () => filterCommandsByQuery(buildActionCommands(), search),
    [search],
  );
  const entityCommands = useMemo(
    () => buildEntityCommands(athletes, trainers, search),
    [athletes, trainers, search],
  );

  const athleteCommands = entityCommands.filter((item) => item.group === 'athletes');
  const trainerCommands = entityCommands.filter((item) => item.group === 'trainers');

  const hasResults =
    navCommands.length > 0 ||
    actionCommands.length > 0 ||
    athleteCommands.length > 0 ||
    trainerCommands.length > 0;

  const handleSelect = useCallback(
    (item: AdminCommandItem) => {
      onOpenChange(false);
      setSearch('');
      router.push(item.href);
    },
    [onOpenChange, router],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearch('');
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Paleta de comandos"
      description="Buscar rutas, acciones y entidades del panel admin"
      showCloseButton={false}
      shouldFilter={false}
      className={cn(
        'gainer-prime-root border border-[#3f4a3c] bg-[#19211d] p-0 text-[#dce5de] shadow-2xl sm:max-w-lg',
        '[&_[cmdk-input-wrapper]]:border-[#3f4a3c]/50',
      )}
    >
      <div className="border-b border-[#3f4a3c]/50 px-4 py-3">
        <p className="gp-module-id gp-mono text-[10px] uppercase text-[#899483]">
          <strong className="text-[#83e77b]">MOD-68</strong>
          {' // '}
          COMANDO_SISTEMA
        </p>
      </div>

      <CommandInput
        onValueChange={setSearch}
        placeholder="Buscar comando..."
        className="gp-mono border-[#3f4a3c]/50 bg-transparent text-[#dce5de] placeholder:text-[#899483]"
      />

      <CommandList className="gp-scroll-thin max-h-[min(70dvh,28rem)]">
        {!hasResults ? (
          <CommandEmpty className="gp-mono py-8 text-sm text-[#899483]">
            {search.trim()
              ? `Sin resultados para "${search.trim()}"`
              : 'Sin resultados'}
          </CommandEmpty>
        ) : null}

        <CommandGroupSection
          heading={GROUP_LABELS.navigation}
          items={navCommands}
          onSelect={handleSelect}
        />
        <CommandGroupSection
          heading={GROUP_LABELS.actions}
          items={actionCommands}
          onSelect={handleSelect}
        />
        <CommandGroupSection
          heading={GROUP_LABELS.athletes}
          items={athleteCommands}
          onSelect={handleSelect}
        />
        <CommandGroupSection
          heading={GROUP_LABELS.trainers}
          items={trainerCommands}
          onSelect={handleSelect}
        />
      </CommandList>
    </CommandDialog>
  );
}
