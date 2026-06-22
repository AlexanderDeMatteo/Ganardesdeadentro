'use client';

import { useAuth } from '@/app/context/auth-context';
import { HeroSection } from '@/components/landing/hero-section';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingNoiseOverlay } from '@/components/landing/v4/landing-noise-overlay';
import { LandingPageBodyV4 } from '@/components/landing/v4/landing-page-body-v4';
import { LANDING_CONFIG } from '@/lib/landing/landing-variant';

type LandingPageContentProps = {
  faqItems?: Array<{ question: string; answer: string }>;
};

export function LandingPageContent({ faqItems = [] }: LandingPageContentProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-root landing-v4 bg-black text-white">
      <LandingNoiseOverlay />
      <LandingNavbar premium />
      <main id="main-content" className="min-h-screen">
        <HeroSection isAuthenticated={isAuthenticated} mascot={LANDING_CONFIG.mascot} />
        <LandingPageBodyV4 isAuthenticated={isAuthenticated} faqItems={faqItems} />
      </main>
    </div>
  );
}
