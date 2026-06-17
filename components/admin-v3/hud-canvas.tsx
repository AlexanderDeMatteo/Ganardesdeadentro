'use client';

import Image from 'next/image';

type HudCanvasProps = {
  children: React.ReactNode;
};

export function HudCanvas({ children }: HudCanvasProps) {
  return (
    <div className="gainer-hud-root hud-canvas-bg relative min-h-screen">
      <div className="hud-watermark" aria-hidden>
        <Image
          src="/brand/be-a-gainer-shield.svg"
          alt=""
          width={320}
          height={380}
          className="opacity-100"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pb-28 pt-6 md:px-8 md:pt-8">
        {children}
      </div>
    </div>
  );
}
