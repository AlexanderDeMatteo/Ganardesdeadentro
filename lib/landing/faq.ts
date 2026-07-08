import { BRAND_NAME } from '@/lib/landing/brand-logo';

export const LANDING_FAQ_ITEMS = [
  {
    question: `¿Qué es ${BRAND_NAME}?`,
    answer:
      `${BRAND_NAME} es una plataforma de fitness que permite a atletas seguir rutinas, métricas y nutrición asignadas por su entrenador, con planes de membresía y asistencia del coach IA Titan.`,
  },
  {
    question: `¿Para quién está pensado ${BRAND_NAME}?`,
    answer:
      'Para atletas que entrenan con supervisión, entrenadores que gestionan sus clientes y administradores que coordinan la plataforma.',
  },
  {
    question: '¿Necesito membresía Premium para usar Titan Nutricional?',
    answer:
      'Sí. El asistente nutricional Titan está disponible para membresías Premium y Pro; la motivación básica del coach está disponible para usuarios autenticados.',
  },
] as const;
