'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LANDING_MASCOT_V1 } from '@/lib/landing/mascot-config';
import { cn } from '@/lib/utils';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';

const TITAN = LANDING_MASCOT_V1;
const TILT_SPRING = { stiffness: 280, damping: 28, mass: 0.6 };
const FLOAT_SPRING = { stiffness: 40, damping: 12 };
const BREATHING_TRANSITION = { duration: 4, ease: 'easeInOut' as const, repeat: Infinity };
const BUBBLE_FLOAT_TRANSITION = { duration: 3.2, ease: 'easeInOut' as const, repeat: Infinity };

const IMAGE_MASK =
  '[-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_98%)] [mask-image:linear-gradient(to_bottom,black_60%,transparent_98%)] [-webkit-mask-size:100%_100%] [mask-size:100%_100%]';

function ParallaxLayer({
  depth,
  pointerX,
  pointerY,
  className,
  children,
}: {
  depth: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useTransform(pointerX, (v) => v * depth);
  const y = useTransform(pointerY, (v) => v * depth);

  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

type CoachTitanVisualV4Props = {
  className?: string;
};

export function CoachTitanVisualV4({ className }: CoachTitanVisualV4Props) {
  const reducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, TILT_SPRING);
  const springY = useSpring(pointerY, TILT_SPRING);

  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  const floatY = useMotionValue(0);
  const springFloatY = useSpring(floatY, FLOAT_SPRING);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    let rafId = 0;
    const tick = () => {
      frame += 0.018;
      floatY.set(Math.sin(frame) * 8);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion, floatY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-[85vw] min-h-[320px] items-end justify-center overflow-visible sm:min-h-[380px] sm:max-w-none lg:min-h-[520px]',
        className,
      )}
    >
      <span
        className="pointer-events-none absolute top-0 left-1/2 z-[-1] -translate-x-1/2 select-none whitespace-nowrap font-black leading-none text-[var(--landing-green-dark)] opacity-[0.07] text-[12rem] lg:-top-12 lg:text-[20rem]"
        aria-hidden
      >
        TITAN
      </span>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgb(104_202_98_/_0.35),transparent_70%)]"
        aria-hidden
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={reducedMotion ? undefined : { duration: 0.55, ease: 'easeOut', delay: 0.35 }}
        className="absolute top-10 right-0 z-30 max-w-[168px] sm:max-w-[190px] lg:-right-10"
      >
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
          transition={reducedMotion ? undefined : BUBBLE_FLOAT_TRANSITION}
          className="relative rounded-lg border border-[var(--landing-green)]/40 bg-[var(--landing-surface)]/80 px-3 py-2.5 shadow-[var(--landing-glow)] backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs font-semibold leading-snug tracking-wide text-[var(--landing-green-pastel)] sm:text-sm">
            Soy Titan. Bienvenido a la élite.
          </p>
          <span
            className="absolute -bottom-2 left-6 h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[var(--landing-green)]/40"
            aria-hidden
          />
          <span
            className="absolute -bottom-[7px] left-6 h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-[color-mix(in_srgb,var(--landing-surface)_80%,transparent)]"
            aria-hidden
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="relative w-full [perspective:1200px]"
        style={reducedMotion ? undefined : { y: springFloatY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative mx-auto flex w-fit flex-col items-center justify-end"
          style={
            reducedMotion
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  transformStyle: 'preserve-3d',
                }
          }
        >
          <ParallaxLayer
            depth={-28}
            pointerX={springX}
            pointerY={springY}
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-8"
          >
            <div className={TITAN.glowBlurClassName} aria-hidden />
          </ParallaxLayer>

          <ParallaxLayer depth={8} pointerX={springX} pointerY={springY} className="relative z-10">
            <motion.div
              animate={reducedMotion ? undefined : { scaleY: [1, 1.015, 1], y: [0, -3, 0] }}
              transition={reducedMotion ? undefined : BREATHING_TRANSITION}
              className="origin-bottom"
            >
              <motion.img
                src={TITAN.src}
                alt="Titan — coach de élite de FitTrack"
                width={TITAN.width}
                height={TITAN.height}
                className={cn(
                  'h-auto w-[280px] max-w-full object-contain object-bottom drop-shadow-[0_24px_48px_rgb(0_0_0_/_0.55)] sm:w-[360px] lg:w-[520px] xl:w-[560px]',
                  IMAGE_MASK,
                )}
              />
            </motion.div>
          </ParallaxLayer>
        </motion.div>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-px w-2/3 bg-[linear-gradient(90deg,transparent,var(--landing-green),transparent)] opacity-60"
        aria-hidden
      />
    </div>
  );
}
