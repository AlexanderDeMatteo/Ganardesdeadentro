'use client';

import { useAuth } from '@/app/context/auth-context';
import { SupportChat } from '@/components/support/support-chat';

export default function AthleteSupportPage() {
  const { user } = useAuth();

  if (!user?.id) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SupportChat
        athleteId={user.id}
        mode="athlete"
        title="Soporte del gimnasio"
        subtitle="Un solo hilo contigo. Escríbenos y te respondemos lo antes posible."
      />
    </div>
  );
}
