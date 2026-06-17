'use client';

import { LandingCoachV4 } from '@/components/landing/v4/landing-coach-v4';
import { LandingCommunityV4 } from '@/components/landing/v4/landing-community-v4';
import { LandingCtaV4 } from '@/components/landing/v4/landing-cta-v4';
import { LandingFaqV4 } from '@/components/landing/v4/landing-faq-v4';
import { LandingFooterV4 } from '@/components/landing/v4/landing-footer-v4';
import { LandingProgramsV4 } from '@/components/landing/v4/landing-programs-v4';

type LandingPageBodyV4Props = {
  isAuthenticated: boolean;
  faqItems?: Array<{ question: string; answer: string }>;
};

export function LandingPageBodyV4({
  isAuthenticated,
  faqItems = [],
}: LandingPageBodyV4Props) {
  return (
    <>
      <LandingProgramsV4 isAuthenticated={isAuthenticated} />
      <LandingCoachV4 />
      <LandingCommunityV4 isAuthenticated={isAuthenticated} />
      <LandingFaqV4 items={faqItems} />
      {!isAuthenticated && <LandingCtaV4 />}
      <LandingFooterV4 />
    </>
  );
}
