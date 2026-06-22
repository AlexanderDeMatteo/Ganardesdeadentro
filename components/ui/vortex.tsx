'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { createNoise3D } from 'simplex-noise';
import { useEffect, useRef, type ReactNode } from 'react';

export interface VortexProps {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}

export function Vortex({
  children,
  className,
  containerClassName,
  particleCount = 200,
  rangeY = 100,
  baseHue = 220,
  baseSpeed = 0,
  rangeSpeed = 1.5,
  baseRadius = 1,
  rangeRadius = 2,
  backgroundColor = '#000000',
}: VortexProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particlePropCount = 9;
    const particlePropsLength = particleCount * particlePropCount;
    const baseTTL = 50;
    const rangeTTL = 150;
    const rangeHue = 100;
    const noiseSteps = 3;
    const xOff = 0.00125;
    const yOff = 0.00125;
    const zOff = 0.0005;
    const TAU = 2 * Math.PI;

    const rand = (n: number) => n * Math.random();
    const randRange = (n: number) => n - rand(2 * n);
    const fadeInOut = (t: number, m: number) => {
      const hm = 0.5 * m;
      return Math.abs(((t + hm) % m) - hm) / hm;
    };
    const lerp = (n1: number, n2: number, speed: number) => (1 - speed) * n1 + speed * n2;

    let tick = 0;
    let particleProps = new Float32Array(particlePropsLength);
    let center: [number, number] = [0, 0];

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      center = [0.5 * canvas.width, 0.5 * canvas.height];
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const initParticle = (i: number) => {
      const x = rand(canvas.width);
      const y = center[1] + randRange(rangeY);
      const ttl = baseTTL + rand(rangeTTL);
      const speed = baseSpeed + rand(rangeSpeed);
      const radius = baseRadius + rand(rangeRadius);
      const hue = baseHue + rand(rangeHue);
      particleProps.set([x, y, 0, 0, 0, ttl, speed, radius, hue], i);
    };

    const initParticles = () => {
      tick = 0;
      particleProps = new Float32Array(particlePropsLength);
      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        initParticle(i);
      }
    };

    const drawParticleStroke = (
      x: number,
      y: number,
      x2: number,
      y2: number,
      life: number,
      ttl: number,
      radius: number,
      hue: number,
    ) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = radius;
      ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    if (reducedMotion) {
      resize();
      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const noise3D = createNoise3D();

    const updateParticle = (i: number) => {
      const i2 = i + 1;
      const i3 = i + 2;
      const i4 = i + 3;
      const i5 = i + 4;
      const i6 = i + 5;
      const i7 = i + 6;
      const i8 = i + 7;
      const i9 = i + 8;

      const x = particleProps[i];
      const y = particleProps[i2];
      const n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
      const vx = lerp(particleProps[i3], Math.cos(n), 0.5);
      const vy = lerp(particleProps[i4], Math.sin(n), 0.5);
      const life = particleProps[i5];
      const ttl = particleProps[i6];
      const speed = particleProps[i7];
      const x2 = x + vx * speed;
      const y2 = y + vy * speed;
      const radius = particleProps[i8];
      const hue = particleProps[i9];

      drawParticleStroke(x, y, x2, y2, life, ttl, radius, hue);

      const nextLife = life + 1;
      particleProps[i] = x2;
      particleProps[i2] = y2;
      particleProps[i3] = vx;
      particleProps[i4] = vy;
      particleProps[i5] = nextLife;

      const outOfBounds = x2 > canvas.width || x2 < 0 || y2 > canvas.height || y2 < 0;
      if (outOfBounds || nextLife > ttl) {
        initParticle(i);
      }
    };

    const renderGlow = () => {
      ctx.save();
      ctx.filter = 'blur(8px) brightness(200%)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.filter = 'blur(4px) brightness(200%)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    };

    const renderToScreen = () => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    };

    const draw = () => {
      tick += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        updateParticle(i);
      }

      renderGlow();
      renderToScreen();

      animationFrameId.current = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    animationFrameId.current = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      initParticles();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', onResize);
    };
  }, [
    reducedMotion,
    particleCount,
    rangeY,
    baseHue,
    baseSpeed,
    rangeSpeed,
    baseRadius,
    rangeRadius,
    backgroundColor,
  ]);

  return (
    <div className={cn('relative h-full w-full', containerClassName)}>
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{ background: backgroundColor }}
      >
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      </div>

      {children ? <div className={cn('relative z-10', className)}>{children}</div> : null}
    </div>
  );
}
