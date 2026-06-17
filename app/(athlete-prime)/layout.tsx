import '@/styles/gainer-prime-theme.css';

import { gainerFontClassName } from '@/lib/fonts/gainer-fonts';
import { AthletePrimeRoot } from '@/components/athlete-prime/athlete-prime-root';

export default function AthletePrimeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={gainerFontClassName}>
      <AthletePrimeRoot>{children}</AthletePrimeRoot>
    </div>
  );
}
