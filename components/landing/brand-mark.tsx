'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { useRef } from 'react';

const WAVE_PATH = 'M 4 32 L 12 32 L 16 24 L 20 8 L 24 32 L 28 28 L 32 32 L 36 32';

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const peakRef = useRef<SVGCircleElement>(null);

  useGSAP(
    () => {
      const circle = circleRef.current;
      const wave = waveRef.current;
      const peak = peakRef.current;
      if (!circle || !wave) return;

      gsap.killTweensOf([circle, wave, peak]);

      if (reducedMotion) {
        gsap.set(circle, { strokeDashoffset: 0, opacity: 1 });
        gsap.set(wave, { strokeDashoffset: 0, opacity: 1 });
        if (peak) gsap.set(peak, { attr: { r: 2 }, opacity: 1 });
        return;
      }

      const circleLength = circle.getTotalLength();
      const waveLength = wave.getTotalLength();

      gsap.set(circle, {
        strokeDasharray: circleLength,
        strokeDashoffset: circleLength,
        opacity: 1,
      });
      gsap.set(wave, {
        strokeDasharray: waveLength,
        strokeDashoffset: waveLength,
        opacity: 1,
      });
      if (peak) {
        gsap.set(peak, { attr: { r: 0 }, opacity: 0 });
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.to(circle, { strokeDashoffset: 0, duration: 0.5 })
        .to(wave, { strokeDashoffset: 0, duration: 0.6 }, '-=0.15')
        .to(peak, { attr: { r: 2 }, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.1');
    },
    { dependencies: [reducedMotion], scope: svgRef },
  );

  const glowKeyframes = reducedMotion
    ? undefined
    : {
        filter: [
          'drop-shadow(0 0 4px rgb(104 202 98 / 0.65))',
          'drop-shadow(0 0 10px rgb(104 202 98 / 0.85))',
          'drop-shadow(0 0 4px rgb(104 202 98 / 0.65))',
        ],
      };

  return (
    <motion.div
      className={cn('relative shrink-0', className)}
      whileHover={
        reducedMotion
          ? undefined
          : {
              scale: 1.06,
              filter: 'drop-shadow(0 0 14px rgb(104 202 98 / 0.9))',
            }
      }
      animate={glowKeyframes}
      transition={
        reducedMotion
          ? undefined
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg
        ref={svgRef}
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        role="img"
        aria-hidden
      >
        <circle
          ref={circleRef}
          cx="20"
          cy="22"
          r="19"
          stroke="var(--landing-green-dark, #255831)"
          strokeWidth="1"
          fill="rgb(18 26 22 / 0.85)"
        />
        <path
          ref={waveRef}
          d={WAVE_PATH}
          stroke="var(--landing-green, #68ca62)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          ref={peakRef}
          cx="20"
          cy="8"
          r="2"
          fill="var(--landing-green, #68ca62)"
        />
      </svg>
    </motion.div>
  );
}
