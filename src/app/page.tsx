"use client";

import { AuthenticatedContent } from '@/features/guest-auth/components/AuthenticatedContent';
import { SessionProvider } from '@/features/session-management/contexts/SessionContext';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';


export default function Home() {
  return (
    <SessionProvider>
      <RoomProvider>
        <AuthenticatedContent />
      </RoomProvider>
    </SessionProvider>
  );
}
