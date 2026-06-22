'use client';

import { LandingPageContent } from '@/components/landing/landing-page-content';

export default function HomePage({
  faqItems = [],
}: {
  faqItems?: Array<{ question: string; answer: string }>;
}) {
  return <LandingPageContent faqItems={faqItems} />;
}
