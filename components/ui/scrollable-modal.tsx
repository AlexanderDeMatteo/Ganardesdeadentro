'use client';

import { Button } from '@/components/ui/button';
import {
  resolveScrollableModalWidth,
  type ScrollableModalSize,
} from '@/lib/ui/scrollable-modal-sizes';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type ScrollableModalProps = {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ScrollableModalSize;
  maxWidth?: string;
  ariaLabelledBy?: string;
};

export function ScrollableModal({
  title,
  onClose,
  children,
  footer,
  size = 'xl',
  maxWidth,
  ariaLabelledBy = 'scrollable-modal-title',
}: ScrollableModalProps) {
  const widthClass = resolveScrollableModalWidth(size, maxWidth);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          className={cn(
            'my-4 flex w-full max-h-[min(90dvh,880px)] flex-col rounded-2xl border border-secondary/20 bg-card shadow-2xl sm:my-6',
            widthClass,
          )}
        >
        <div className="flex shrink-0 items-center justify-between border-b border-secondary/20 px-4 py-3 sm:px-8 sm:py-6">
          <h2 id={ariaLabelledBy} className="text-lg font-bold leading-tight sm:text-xl md:text-2xl">
            {title}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 shrink-0 border-secondary/30 p-0"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-secondary/20 px-4 py-3 sm:px-8 sm:py-4">{footer}</div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
