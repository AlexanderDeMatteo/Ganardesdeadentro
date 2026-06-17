import '@/styles/gainer-prime-theme.css';

import { gainerFontClassName } from '@/lib/fonts/gainer-fonts';
import { TrainerPrimeRoot } from '@/components/trainer-v2/trainer-prime-root';

export default function TrainerV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={gainerFontClassName}>
      <TrainerPrimeRoot>{children}</TrainerPrimeRoot>
    </div>
  );
}
