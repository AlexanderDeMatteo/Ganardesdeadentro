import { describe, expect, it } from 'vitest';
import {
  buildEntityCommands,
  buildNavCommands,
} from '@/lib/admin-v2/admin-command-items';
import { ADMIN_V2_NAV_ITEMS } from '@/lib/auth/role-routes';
import type { Athlete, Trainer } from '@/lib/data/types';

const athletes: Athlete[] = Array.from({ length: 10 }, (_, index) => ({
  id: `a${index}`,
  name: `Atleta ${index}`,
  email: `atleta${index}@test.com`,
  age: 25,
  gender: 'male',
  weight: 70,
  height: 175,
  joinDate: '2025-01-01',
  membershipLevel: 'basic',
}));

const trainers: Trainer[] = [
  {
    id: 't1',
    name: 'Coach Alpha',
    email: 'alpha@test.com',
    specialization: 'Strength',
    athletes: 3,
    rating: 5,
    joinDate: '2024-01-01',
  },
];

describe('buildNavCommands', () => {
  it('returns one item per ADMIN_V2_NAV_ITEMS entry', () => {
    const commands = buildNavCommands();
    expect(commands).toHaveLength(ADMIN_V2_NAV_ITEMS.length);
    expect(commands[0]?.href).toBe('/admin-v2');
  });
});

describe('buildEntityCommands', () => {
  it('filters athletes by name or email case-insensitively', () => {
    const commands = buildEntityCommands(athletes, trainers, 'ATLETA 2');
    expect(commands.some((c) => c.id === 'athlete-a2')).toBe(true);
    expect(commands.every((c) => c.group === 'athletes' || c.group === 'trainers')).toBe(true);
  });

  it('limits results to 8 per entity group', () => {
    const commands = buildEntityCommands(athletes, trainers);
    const athleteResults = commands.filter((c) => c.group === 'athletes');
    expect(athleteResults).toHaveLength(8);
  });

  it('builds athlete deep links with athlete query param', () => {
    const commands = buildEntityCommands(athletes, trainers, 'atleta0');
    expect(commands.find((c) => c.id === 'athlete-a0')?.href).toBe('/admin-v2/athletes?athlete=a0');
  });
});
