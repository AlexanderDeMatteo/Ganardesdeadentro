'use client';

import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { LANDING_MASCOT_V1, type LandingMascotConfig } from '@/lib/landing/mascot-config';

const GREETINGS = ['¡Hola, futuro ganador!', 'Comienza tu entrenamiento hoy'];

const TILT_SPRING = { stiffness: 280, damping: 28, mass: 0.6 };
const FLOAT_SPRING = { stiffness: 40, damping: 12 };

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

export function CoachParallaxCard({ mascot = LANDING_MASCOT_V1 }: { mascot?: LandingMascotConfig }) {
  const reducedMotion = useReducedMotion();
  const [greetingIndex, setGreetingIndex] = useState(0);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, TILT_SPRING);
  const springY = useSpring(pointerY, TILT_SPRING);

  const rotateX = useTransform(springY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);

  const floatY = useMotionValue(0);
  const springFloatY = useSpring(floatY, FLOAT_SPRING);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setGreetingIndex((i) => (i + 1) % GREETINGS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    let rafId = 0;
    const tick = () => {
      frame += 0.018;
      floatY.set(Math.sin(frame) * 10);
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
    <div className="relative flex w-full max-w-sm flex-col items-center lg:max-w-md lg:flex-shrink-0">
      <motion.div
        className="relative w-full [perspective:1200px]"
        style={reducedMotion ? undefined : { y: springFloatY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative mx-auto flex w-fit items-center justify-center"
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
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={mascot.glowBlurClassName} aria-hidden />
          </ParallaxLayer>

          <ParallaxLayer
            depth={-12}
            pointerX={springX}
            pointerY={springY}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={mascot.glowRingClassName} aria-hidden />
          </ParallaxLayer>

          <ParallaxLayer depth={8} pointerX={springX} pointerY={springY} className="relative z-10">
            <motion.div
              key={greetingIndex}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="absolute -right-2 -top-2 z-20 max-w-[180px] rounded-lg border border-[var(--landing-green-dark)] bg-[var(--landing-surface)] px-3 py-2 text-center shadow-[var(--landing-glow)] sm:-right-6 sm:-top-4 sm:max-w-[200px]"
              role="status"
              aria-live="polite"
            >
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--landing-green)] sm:text-sm">
                {GREETINGS[greetingIndex]}
              </p>
              <span
                className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-[var(--landing-green-dark)]"
                aria-hidden
              />
            </motion.div>

            <Image
              src={mascot.src}
              alt={mascot.alt}
              width={mascot.width}
              height={mascot.height}
              priority
              className={mascot.imageClassName}
              sizes={mascot.sizes}
            />
          </ParallaxLayer>
        </motion.div>
      </motion.div>
    </div>
  );
}
