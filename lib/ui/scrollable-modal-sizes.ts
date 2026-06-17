export type ScrollableModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'wide' | 'full';

/** Anchos estándar para modales scrollables (admin + admin-v2). */
export const SCROLLABLE_MODAL_SIZE_CLASS: Record<ScrollableModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  wide: 'max-w-3xl',
  full: 'max-w-5xl',
};

export function resolveScrollableModalWidth(
  size: ScrollableModalSize = 'xl',
  maxWidth?: string,
): string {
  return maxWidth ?? SCROLLABLE_MODAL_SIZE_CLASS[size];
}

/** PrimeTopBar es h-20 (5rem) fijo — modales V2 se posicionan debajo. */
export const PRIME_TOPBAR_HEIGHT = '5rem';

export const PRIME_SIDEBAR_WIDTH = '280px';

export const PRIME_MODAL_POSITIONER_CLASS =
  'mt-20 flex min-h-[calc(100dvh-5rem)] justify-center px-3 pb-8 sm:px-6';
