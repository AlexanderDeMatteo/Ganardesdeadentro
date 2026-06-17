'use client';

import { LandingPageContent } from '@/components/landing/landing-page-content';
import { LANDING_VARIANT_V3 } from '@/lib/landing/landing-variant';

export default function LandingV3PageClient({
  faqItems = [],
}: {
  faqItems?: Array<{ question: string; answer: string }>;
}) {
  return <LandingPageContent faqItems={faqItems} variant={LANDING_VARIANT_V3} />;
}
