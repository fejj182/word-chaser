"use client";

import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';
import { AuthenticatedContent } from '@/features/guest-auth/components/AuthenticatedContent';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';


export default function Home() {
  return (
    <RoomProvider>
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
    </RoomProvider>
  );
}
