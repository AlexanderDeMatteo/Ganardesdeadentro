import '@/styles/gainer-prime-theme.css';

import { gainerFontClassName } from '@/lib/fonts/gainer-fonts';
import { PrimeRoot } from '@/components/admin-v2/prime-root';

export default function AdminV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={gainerFontClassName}>
      <PrimeRoot>{children}</PrimeRoot>
    </div>
  );
}
