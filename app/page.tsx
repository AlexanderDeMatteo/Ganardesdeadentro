import type { Metadata } from 'next';
import PageClient from './page-client';
import { FaqJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';

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

const FAQ_ITEMS = [
  {
    question: '¿Qué es FitTrack?',
    answer:
      'FitTrack es una plataforma de fitness que permite a atletas seguir rutinas, métricas y nutrición asignadas por su entrenador, con planes de membresía y asistencia del coach IA Titan.',
  },
  {
    question: '¿Para quién está pensado FitTrack?',
    answer:
      'Para atletas que entrenan con supervisión, entrenadores que gestionan sus clientes y administradores que coordinan la plataforma.',
  },
  {
    question: '¿Necesito membresía Premium para usar Titan Nutricional?',
    answer:
      'Sí. El asistente nutricional Titan está disponible para membresías Premium y Pro; la motivación básica del coach está disponible para usuarios autenticados.',
  },
];

export default function Page() {
  return (
    <>
      <OrganizationJsonLd />
      <FaqJsonLd items={FAQ_ITEMS} />
      <PageClient faqItems={FAQ_ITEMS} />
    </>
  );
}
