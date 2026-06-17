'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

type SpotlightProps = {
  className?: string;
  children?: ReactNode;
};

const SPRING = { stiffness: 80, damping: 22, mass: 0.4 };

export function Spotlight({ className, children }: SpotlightProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, SPRING);
  const springY = useSpring(mouseY, SPRING);

  const spotlight = useMotionTemplate`radial-gradient(640px circle at ${springX}px ${springY}px, rgb(104 202 98 / 0.18), transparent 72%)`;
  const spotlightSecondary = useMotionTemplate`radial-gradient(420px circle at ${springX}px ${springY}px, rgb(37 88 49 / 0.35), transparent 68%)`;

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(rect.width * 0.72);
    mouseY.set(rect.height * 0.45);
  }, [reducedMotion, mouseX, mouseY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(rect.width * 0.72);
    mouseY.set(rect.height * 0.45);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {reducedMotion ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(640px circle at 72% 45%, rgb(104 202 98 / 0.14), transparent 72%)',
          }}
          aria-hidden
        />
      ) : (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: spotlightSecondary }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: spotlight }}
            aria-hidden
          />
        </>
      )}
      {children}
    </div>
  );
}
