import '@/styles/gainer-hud-theme.css';

import { gainerFontClassName } from '@/lib/fonts/gainer-fonts';
import { HudRoot } from '@/components/admin-v3/hud-root';

export default function AdminV3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={gainerFontClassName}>
      <HudRoot>{children}</HudRoot>
    </div>
  );
}
