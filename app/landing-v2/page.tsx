import type { Metadata } from 'next';
import LandingV2PageClient from './page-client';
import { FaqJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';
import { LANDING_FAQ_ITEMS } from '@/lib/landing/faq';

export const metadata: Metadata = {
  title: 'FitTrack — Landing v2 (BE A GAINER)',
  description:
    'Vista previa de la landing con identidad BE A GAINER LIFE: entrenamiento guiado, rutinas y progreso medible.',
  robots: {
    index: false,
    follow: false,
  },
};

const FAQ_ITEMS = [...LANDING_FAQ_ITEMS];

export default function LandingV2Page() {
  return (
    <>
      <OrganizationJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />
      <LandingV2PageClient faqItems={FAQ_ITEMS} />
    </>
  );
}
