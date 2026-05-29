'use client';

import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useTypewriter(
  fullText: string,
  messageKey: string | number,
  msPerChar = 32,
): { displayed: string; isComplete: boolean } {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayed('');
      setIsComplete(true);
      return;
    }

    if (prefersReducedMotion()) {
      setDisplayed(fullText);
      setIsComplete(true);
      return;
    }

    setDisplayed('');
    setIsComplete(false);
    let index = 0;

    const id = setInterval(() => {
      index += 1;
      setDisplayed(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(id);
        setIsComplete(true);
      }
    }, msPerChar);

    return () => clearInterval(id);
  }, [fullText, messageKey, msPerChar]);

  return { displayed, isComplete };
}
