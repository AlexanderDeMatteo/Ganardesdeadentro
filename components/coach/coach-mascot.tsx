'use client';

import Link from 'next/link';
import { MessageCircle, Minimize2 } from 'lucide-react';
import { CoachAvatar } from '@/components/coach/coach-avatar';
import { Button } from '@/components/ui/button';
import { useCoachTips } from '@/hooks/use-coach-tips';
import { cn } from '@/lib/utils';

export function CoachMascot() {
  const { tip, isMinimized, minimize, restore } = useCoachTips();

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={restore}
        className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-2xl transition hover:scale-105 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6"
        aria-label="Abrir coach visual"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <aside
      className={cn(
        'coach-dialog fixed bottom-3 right-3 z-40 sm:bottom-5 sm:right-5',
        `coach-dialog--${tip.mood}`,
      )}
      aria-label="Coach visual de FitTrack"
    >
      <div className="coach-dialog__inner">
        <div className="coach-dialog__bubbleWrap">
          <div className="coach-dialog__bubbleBody">
            <div className="coach-dialog__bubbleHeader">
              <p className="coach-dialog__kicker brand-kicker">{tip.eyebrow}</p>
              <button
                type="button"
                onClick={minimize}
                className="coach-dialog__minimize shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7f9]"
                aria-label="Minimizar coach visual"
              >
                <Minimize2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <p className="coach-dialog__message" aria-live="polite">
              {tip.message}
            </p>

            {tip.actionHref && tip.actionLabel && (
              <Button asChild size="sm" className="coach-dialog__cta">
                <Link href={tip.actionHref}>{tip.actionLabel}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="coach-dialog__trainer">
          <div className="coach-dialog__trainerGlow" aria-hidden />
          <CoachAvatar mood={tip.mood} className="coach-dialog__avatar" priority />
        </div>
      </div>
    </aside>
  );
}
