'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  PRIME_MODAL_POSITIONER_CLASS,
  resolveScrollableModalWidth,
  type ScrollableModalSize,
} from '@/lib/ui/scrollable-modal-sizes';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type PrimeScrollableModalProps = {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Escala unificada; `maxWidth` tiene prioridad si se pasa explícitamente. */
  size?: ScrollableModalSize;
  maxWidth?: string;
  /** Formularios cortos: altura según contenido; scroll solo si hace falta. */
  fitContent?: boolean;
  /** Alineación vertical del diálogo en el viewport (debajo de la top bar). */
  align?: 'start' | 'center';
  ariaLabelledBy?: string;
  modId?: string;
};

function resolveDialogMaxHeight(align: 'start' | 'center', boundDialogHeight: boolean): string {
  if (!boundDialogHeight) return 'h-auto max-h-none';
  if (align === 'start') return 'max-h-[min(calc(100dvh-8.5rem),840px)]';
  return 'max-h-[min(calc(100dvh-7rem),920px)]';
}

export function PrimeScrollableModal({
  title,
  onClose,
  children,
  footer,
  size = 'xl',
  maxWidth,
  fitContent = false,
  align = 'center',
  ariaLabelledBy = 'prime-scrollable-modal-title',
  modId,
}: PrimeScrollableModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const widthClass = resolveScrollableModalWidth(size, maxWidth);
  const hasFooter = Boolean(footer);
  /** Con footer, el diálogo debe caber en viewport y el scroll queda solo en el cuerpo. */
  const boundDialogHeight = !fitContent || hasFooter;

  const modal = (
    <div className="gainer-prime-root fixed inset-0 z-[200] overflow-hidden bg-[#0d1511]/80 backdrop-blur-sm">
      <div
        className={cn(
          'gp-scroll-thin overflow-y-auto',
          align === 'start'
            ? 'flex justify-center px-3 pb-10 pt-[5.25rem] sm:px-6 sm:pt-[5.5rem]'
            : cn(
                PRIME_MODAL_POSITIONER_CLASS,
                'flex',
                fitContent && !hasFooter ? 'items-start pt-3 sm:pt-4' : 'items-center pt-6',
              ),
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          className={cn(
            'gp-module gp-module-corner flex w-full min-w-0 flex-col shadow-2xl',
            resolveDialogMaxHeight(align, boundDialogHeight),
            widthClass,
          )}
        >
          <div className="gp-module-header flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {modId ? (
                <p className="gp-module-id mb-1">
                  <strong>MOD-{modId}</strong>
                  {' // '}
                  {typeof title === 'string' ? title.toUpperCase().replace(/\s+/g, '_') : 'MODAL'}
                </p>
              ) : null}
              <h2
                id={ariaLabelledBy}
                className="gp-display text-base leading-tight gp-text-primary sm:text-lg md:text-xl"
              >
                {title}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gp-btn-ghost h-8 w-8 shrink-0 p-0"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={cn(
              'gp-scroll-thin p-4 sm:p-6',
              boundDialogHeight
                ? 'min-h-0 flex-1 overflow-y-auto'
                : 'max-h-[min(70dvh,36rem)] overflow-y-auto',
            )}
          >
            {children}
          </div>

          {footer ? (
            <div className="gp-modal-footer shrink-0 p-3 sm:px-6 sm:py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modal, document.body);
}
