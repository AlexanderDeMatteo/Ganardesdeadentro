import { LANDING_MASCOT_V2, type LandingMascotConfig } from '@/lib/landing/mascot-config';

export type LandingConfig = {
  mascot: LandingMascotConfig;
};

export const LANDING_CONFIG: LandingConfig = {
  mascot: LANDING_MASCOT_V2,
};
