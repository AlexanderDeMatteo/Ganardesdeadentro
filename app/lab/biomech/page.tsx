import type { Metadata } from 'next';

import BiomechLabClient from './page-client';

export const metadata: Metadata = {
  title: 'Lab Biomecánico | BE A GAINER',
  description: 'Visor interactivo de activación muscular por fase del movimiento.',
};

export default function BiomechLabPage() {
  return <BiomechLabClient />;
}
