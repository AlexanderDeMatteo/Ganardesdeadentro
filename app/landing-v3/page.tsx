import type { Metadata } from 'next';
import LandingV3PageClient from './page-client';
import { FaqJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';
import { LANDING_FAQ_ITEMS } from '@/lib/landing/faq';

export const metadata: Metadata = {
  title: 'FitTrack — Landing v3 (Vortex)',
  description:
    'Vista previa de la landing con fondo Vortex y escudo BE A GAINER LIFE: entrenamiento guiado con energía visual premium.',
  robots: {
    index: false,
    follow: false,
  },
};

const FAQ_ITEMS = [...LANDING_FAQ_ITEMS];

export default function LandingV3Page() {
  return (
    <>
      <OrganizationJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />
      <LandingV3PageClient faqItems={FAQ_ITEMS} />
    </>
  );
}
