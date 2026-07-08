import type { Metadata } from 'next';
import PageClient from './page-client';
import { FaqJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';
import { LANDING_FAQ_ITEMS } from '@/lib/landing/faq';
import { BRAND_NAME, DEFAULT_SITE_URL } from '@/lib/landing/brand-logo';

const SITE_URL = DEFAULT_SITE_URL;

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Entrenamiento personalizado y seguimiento fitness`,
  description:
    `${BRAND_NAME} conecta atletas, entrenadores y administradores: rutinas asignadas, métricas, nutrición, membresías y coach IA Titan.`,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${BRAND_NAME} — Transforma tu cuerpo con entrenamiento guiado`,
    description:
      'Plataforma fitness con planes personalizados, progreso medible y supervisión profesional.',
    url: SITE_URL,
    siteName: BRAND_NAME,
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — Entrenamiento personalizado`,
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
