import type { Metadata } from 'next';
import PageClient from './page-client';
import { FaqJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';
import { LANDING_FAQ_ITEMS } from '@/lib/landing/faq';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fittrack.app';

export const metadata: Metadata = {
  title: 'FitTrack — Entrenamiento personalizado y seguimiento fitness',
  description:
    'FitTrack conecta atletas, entrenadores y administradores: rutinas asignadas, métricas, nutrición, membresías y coach IA Titan.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'FitTrack — Transforma tu cuerpo con entrenamiento guiado',
    description:
      'Plataforma fitness con planes personalizados, progreso medible y supervisión profesional.',
    url: SITE_URL,
    siteName: 'FitTrack',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitTrack — Entrenamiento personalizado',
    description:
      'Rutinas, métricas, nutrición y membresías en una sola plataforma para atletas y entrenadores.',
  },
};

const FAQ_ITEMS = [...LANDING_FAQ_ITEMS];

export default function Page() {
  return (
    <>
      <OrganizationJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient faqItems={FAQ_ITEMS} />
    </>
  );
}
