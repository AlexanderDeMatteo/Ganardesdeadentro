export type LandingMascotConfig = {
  id: 'v1' | 'v2';
  src: string;
  alt: string;
  width: number;
  height: number;
  imageClassName: string;
  sizes: string;
  showKickerLogo: boolean;
  kickerLogoSrc: string;
  progressAspect: string;
  coachAspect: string;
  progressImageClassName: string;
  coachImageClassName: string;
  coachContainerClassName: string;
  glowBlurClassName: string;
  glowRingClassName: string;
};

import { OFFICIAL_BRAND_LOGO } from '@/lib/landing/brand-logo';

const KICKER_LOGO = OFFICIAL_BRAND_LOGO;

export const LANDING_MASCOT_V1: LandingMascotConfig = {
  id: 'v1',
  src: '/coach-trainer.png',
  alt: 'Entrenador mascota de FitTrack con mancuernas',
  width: 400,
  height: 460,
  imageClassName:
    'relative h-auto w-[240px] object-contain drop-shadow-[0_24px_48px_rgb(0_0_0_/_0.55)] sm:w-[280px] lg:w-[360px]',
  sizes: '(max-width: 1024px) 60vw, 360px',
  showKickerLogo: true,
  kickerLogoSrc: KICKER_LOGO,
  progressAspect: 'aspect-[3/4]',
  coachAspect: 'aspect-[4/5]',
  progressImageClassName: 'object-cover object-top contrast-[1.05]',
  coachImageClassName: 'object-cover object-top contrast-[1.06]',
  coachContainerClassName: 'bg-muted',
  glowBlurClassName:
    'h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgb(104_202_98_/_0.35)_0%,rgb(37_88_49_/_0.15)_45%,transparent_70%)] blur-2xl sm:h-[320px] sm:w-[320px] lg:h-[380px] lg:w-[380px]',
  glowRingClassName:
    'h-[220px] w-[220px] rounded-full border border-[var(--landing-green)]/25 shadow-[var(--landing-glow-strong)] sm:h-[260px] sm:w-[260px] lg:h-[300px] lg:w-[300px]',
};

export const LANDING_MASCOT_V2: LandingMascotConfig = {
  id: 'v2',
  src: KICKER_LOGO,
  alt: 'BE A GAINER LIFE — mascota del programa',
  width: 480,
  height: 480,
  imageClassName:
    'relative h-auto w-[260px] object-contain drop-shadow-[0_24px_48px_rgb(0_0_0_/_0.55)] sm:w-[300px] lg:w-[380px]',
  sizes: '(max-width: 1024px) 65vw, 380px',
  showKickerLogo: false,
  kickerLogoSrc: KICKER_LOGO,
  progressAspect: 'aspect-square',
  coachAspect: 'aspect-square',
  progressImageClassName: 'object-contain p-4 contrast-[1.05]',
  coachImageClassName: 'object-contain p-6 contrast-[1.06]',
  coachContainerClassName: 'bg-[var(--landing-bg)]',
  glowBlurClassName:
    'h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgb(104_202_98_/_0.35)_0%,rgb(37_88_49_/_0.15)_45%,transparent_70%)] blur-2xl sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]',
  glowRingClassName:
    'h-[240px] w-[240px] rounded-full border border-[var(--landing-green)]/25 shadow-[var(--landing-glow-strong)] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]',
};

/** Mascot oficial para auth — escala dentro del contenedor sin recortes. */
export const LANDING_MASCOT_AUTH: LandingMascotConfig = {
  ...LANDING_MASCOT_V2,
  imageClassName:
    'relative mx-auto h-auto w-full max-w-[180px] object-contain object-center sm:max-w-[200px] lg:max-w-[200px] drop-shadow-[0_24px_48px_rgb(0_0_0_/_0.55)]',
  sizes: '(max-width: 1024px) 45vw, 200px',
  glowBlurClassName:
    'h-[170px] w-[170px] rounded-full bg-[radial-gradient(circle,rgb(104_202_98_/_0.35)_0%,rgb(37_88_49_/_0.15)_45%,transparent_70%)] blur-2xl sm:h-[190px] sm:w-[190px] lg:h-[210px] lg:w-[210px]',
  glowRingClassName:
    'h-[145px] w-[145px] rounded-full border border-[var(--landing-green)]/25 shadow-[var(--landing-glow-strong)] sm:h-[165px] sm:w-[165px] lg:h-[185px] lg:w-[185px]',
};
