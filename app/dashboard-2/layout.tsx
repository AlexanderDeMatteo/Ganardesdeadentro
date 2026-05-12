import type { ReactNode } from 'react';
import { Anton, Lexend, Space_Grotesk } from 'next/font/google';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dashboard-anton',
  display: 'swap',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-dashboard-lexend',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-dashboard-space',
  display: 'swap',
});

export default function Dashboard2Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${anton.variable} ${lexend.variable} ${spaceGrotesk.variable} dashboard-mock-root min-h-screen`}
    >
      {children}
    </div>
  );
}
