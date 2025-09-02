"use client";

import { AuthenticatedContent } from '@/features/guest-auth/components/AuthenticatedContent';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';


export default function Home() {
  return (
    <RoomProvider>
      <AuthenticatedContent />
    </RoomProvider>
  );
}
