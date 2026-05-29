'use client';

import { useEffect, type RefObject } from 'react';
import { useTypewriter } from '@/hooks/use-typewriter';
import { cn } from '@/lib/utils';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type CoachTitanMessageProps = {
  isLoading: boolean;
  text: string | null;
  messageKey: number;
  className?: string;
  /** Habilita efecto typewriter (cursor). */
  animate?: boolean;
  /** ms por carácter; informes largos suelen ir más rápido. */
  msPerChar?: number;
  /** Contenedor con overflow para seguir el texto mientras escribe. */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Estilo de párrafo para informe post-rutina. */
  isReview?: boolean;
};

export function CoachTitanMessage({
  isLoading,
  text,
  messageKey,
  className,
  animate = true,
  msPerChar = 32,
  scrollContainerRef,
  isReview = false,
}: CoachTitanMessageProps) {
  const { displayed, isComplete } = useTypewriter(
    animate ? (text ?? '') : '',
    messageKey,
    msPerChar,
  );
  const showText = animate ? displayed : (text ?? '');
  const complete = animate ? isComplete : Boolean(text);

  useEffect(() => {
    if (!animate || !scrollContainerRef?.current) return;
    if (prefersReducedMotion()) return;
    const el = scrollContainerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [displayed, animate, scrollContainerRef]);

  if (isLoading) {
    return (
      <div
        className={cn('coach-dialog__loader-wrap', className)}
        aria-busy="true"
      >
        <div className="coach-dialog__loader-wrap--animated" aria-hidden>
          <div className="coach-dialog__loader coach-dialog__loader--ring">
            <div className="coach-dialog__ring">
              <span />
            </div>
          </div>
          <div className="coach-dialog__loader coach-dialog__loader--dots">
            <div />
            <div />
            <div />
          </div>
        </div>
        <span className="coach-dialog__loader-static" aria-hidden>
          ...
        </span>
        <span className="sr-only">Titan está pensando…</span>
      </div>
    );
  }

  if (!text) {
    return (
      <p className={cn(className, 'min-h-[1.48em]')} aria-hidden>
        {' '}
      </p>
    );
  }

  return (
    <p
      className={cn(
        className,
        'whitespace-pre-wrap',
        isReview && 'coach-dialog__message--review',
      )}
      aria-live="off"
    >
      {showText}
      {animate && !complete ? (
        <span className="coach-dialog__cursor" aria-hidden>
          |
        </span>
      ) : null}
      {complete && text ? <span className="sr-only">{text}</span> : null}
    </p>
  );
}
