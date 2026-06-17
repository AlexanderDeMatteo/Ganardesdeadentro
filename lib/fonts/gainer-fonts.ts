import { Anybody, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

export const gainerDisplay = Anybody({
  subsets: ['latin'],
  variable: '--font-gainer-display',
  weight: ['700', '800'],
});

export const gainerBody = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-gainer-body',
  weight: ['400', '600'],
});

export const gainerMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-gainer-mono',
  weight: ['500'],
});

export const gainerFontClassName = `${gainerDisplay.variable} ${gainerBody.variable} ${gainerMono.variable}`;
