import { TrainerPanelLayout } from '@/components/layout/trainer-panel-layout';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return <TrainerPanelLayout>{children}</TrainerPanelLayout>;
}
