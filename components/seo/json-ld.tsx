import { BRAND_NAME, DEFAULT_SITE_URL } from '@/lib/landing/brand-logo';

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: BRAND_NAME,
        url: DEFAULT_SITE_URL,
        description:
          'Plataforma de entrenamiento personalizado con seguimiento de progreso, nutrición y supervisión por entrenadores.',
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        name: BRAND_NAME,
        url: DEFAULT_SITE_URL,
        description:
          'Entrenamientos personalizados, métricas, nutrición y membresías para atletas, entrenadores y administradores.',
        inLanguage: 'es',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FaqJsonLd({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
