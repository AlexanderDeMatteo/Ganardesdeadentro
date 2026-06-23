'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Minimize2 } from 'lucide-react';
import { CoachAvatar } from '@/components/coach/coach-avatar';
import { Button } from '@/components/ui/button';
import { CoachTitanMessage } from '@/components/coach/coach-titan-message';
import { useAuth } from '@/app/context/auth-context';
import { useCoach } from '@/app/context/coach-context';
import { isAdminPreviewPath, isPublicAuthPath } from '@/lib/auth/role-routes';
import { cn } from '@/lib/utils';

export function CoachMascot() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname() ?? '';
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const {
    tip,
    coachMood,
    isMinimized,
    isTitanLoading,
    titanMessage,
    titanFetchId,
    showTitanUi,
    isSessionReviewActive,
    isNutritionAssistantActive,
    nutritionMessages,
    nutritionEstimate,
    nutritionQuickReplies,
    nutritionError,
    minimize,
    restore,
    sendNutritionReply,
    confirmNutritionEstimate,
  } = useCoach();
  const [nutritionInput, setNutritionInput] = useState('');

  if (!isAuthenticated || isAdminPreviewPath(pathname) || isPublicAuthPath(pathname)) {
    return null;
  }

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
        `coach-dialog--${coachMood}`,
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

            {showTitanUi ? (
              <div
                ref={messageScrollRef}
                className={cn(
                  'coach-dialog__messageScroll',
                  isSessionReviewActive && 'coach-dialog__messageScroll--review',
                )}
              >
                {isNutritionAssistantActive ? (
                  <div className="space-y-2">
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md bg-muted/30 p-2 text-sm">
                      {nutritionMessages.map((msg, idx) => (
                        <p key={`${msg.role}-${idx}`} className="leading-relaxed">
                          <span className="font-semibold">{msg.role === 'assistant' ? 'Titan' : 'Tú'}:</span>{' '}
                          {msg.content}
                        </p>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={nutritionInput}
                        onChange={(e) => setNutritionInput(e.target.value)}
                        placeholder="Responde a Titan..."
                        className="h-9 w-full rounded-md border border-input bg-input/50 px-3 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!nutritionInput.trim()) return;
                          sendNutritionReply(nutritionInput);
                          setNutritionInput('');
                        }}
                        disabled={isTitanLoading || nutritionInput.trim().length === 0}
                      >
                        Enviar
                      </Button>
                    </div>

                    {nutritionQuickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nutritionQuickReplies.map((reply) => (
                          <Button
                            key={reply}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => sendNutritionReply(reply)}
                            disabled={isTitanLoading}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    )}

                    {nutritionError && <p className="text-xs text-destructive">{nutritionError}</p>}

                    {nutritionEstimate && (
                      <div className="space-y-2 rounded-md border border-border bg-background/80 p-2 text-sm">
                        <p className="font-semibold">
                          Estimación: {nutritionEstimate.totalCalories} kcal ({nutritionEstimate.confidence})
                        </p>
                        <div className="max-h-32 space-y-1 overflow-y-auto rounded-md bg-muted/30 p-2 text-xs">
                          {nutritionEstimate.items.map((item, idx) => (
                            <div key={`${item.name}-${idx}`} className="rounded border border-border/60 p-2">
                              <p className="font-semibold text-foreground">
                                {item.name} - {item.quantity}
                              </p>
                              <p className="text-muted-foreground">
                                {item.calories} kcal · P {item.proteinG}g · C {item.carbsG}g · G {item.fatG}g
                              </p>
                            </div>
                          ))}
                        </div>
                        <Button type="button" size="sm" onClick={confirmNutritionEstimate}>
                          Confirmar y registrar
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <CoachTitanMessage
                    isLoading={isTitanLoading}
                    text={titanMessage}
                    messageKey={titanFetchId}
                    className="coach-dialog__message"
                    animate
                    msPerChar={isSessionReviewActive ? 18 : 32}
                    scrollContainerRef={messageScrollRef}
                    isReview={isSessionReviewActive}
                  />
                )}
              </div>
            ) : (
              <p className="coach-dialog__message" aria-live="polite">
                {tip.message}
              </p>
            )}

            {tip.actionHref && tip.actionLabel && !isSessionReviewActive && !isNutritionAssistantActive && (
              <Button asChild size="sm" className="coach-dialog__cta">
                <Link href={tip.actionHref}>{tip.actionLabel}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="coach-dialog__trainer">
          <div className="coach-dialog__trainerGlow" aria-hidden />
          <CoachAvatar mood={coachMood} className="coach-dialog__avatar" priority />
        </div>
      </div>
    </aside>
  );
}
