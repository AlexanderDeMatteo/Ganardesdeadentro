'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { OFFICIAL_BRAND_LOGO, OFFICIAL_BRAND_LOGO_ALT } from '@/lib/landing/brand-logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  glow?: boolean;
};

export function BrandLogo({ className, priority = false, glow = true }: BrandLogoProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'relative shrink-0',
        glow && 'drop-shadow-[0_0_20px_rgb(104_202_98_/_0.3)]',
        className,
      )}
      whileHover={reducedMotion ? undefined : { scale: 1.03 }}
      animate={
        reducedMotion || !glow
          ? undefined
          : {
              filter: [
                'drop-shadow(0 0 12px rgb(104 202 98 / 0.35))',
                'drop-shadow(0 0 22px rgb(104 202 98 / 0.5))',
                'drop-shadow(0 0 12px rgb(104 202 98 / 0.35))',
              ],
            }
      }
      transition={reducedMotion ? undefined : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Image
        src={OFFICIAL_BRAND_LOGO}
        alt={OFFICIAL_BRAND_LOGO_ALT}
        width={480}
        height={480}
        priority={priority}
        className="h-full w-full object-contain mix-blend-screen"
      />
    </motion.div>
  );
}
