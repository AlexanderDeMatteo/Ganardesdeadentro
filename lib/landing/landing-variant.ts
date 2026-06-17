import {
  LANDING_MASCOT_V1,
  LANDING_MASCOT_V2,
  type LandingMascotConfig,
} from '@/lib/landing/mascot-config';

export type LandingHeroBackground = 'spotlight' | 'vortex' | 'lightPillar';

export type LandingVariantConfig = {
  id: 'v1' | 'v2' | 'v3' | 'v4';
  mascot: LandingMascotConfig;
  heroBackground: LandingHeroBackground;
};

export const LANDING_VARIANT_V1: LandingVariantConfig = {
  id: 'v1',
  mascot: LANDING_MASCOT_V1,
  heroBackground: 'spotlight',
};

export const LANDING_VARIANT_V2: LandingVariantConfig = {
  id: 'v2',
  mascot: LANDING_MASCOT_V2,
  heroBackground: 'spotlight',
};

export const LANDING_VARIANT_V3: LandingVariantConfig = {
  id: 'v3',
  mascot: LANDING_MASCOT_V2,
  heroBackground: 'vortex',
};

export const LANDING_VARIANT_V4: LandingVariantConfig = {
  id: 'v4',
  mascot: LANDING_MASCOT_V2,
  heroBackground: 'lightPillar',
};
