"use client";

import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { useUser } from '@/features/user-management/contexts/UserContext';
import { UserDisplay } from '@/features/user-management/components/UserDisplay';
import RoomManager from '@/features/room-management/components/RoomManager';
import { GameHeader } from '@/features/user-management/components/GameHeader';
import { Features } from '@/features/development/components/Features';

export default function Home() {
  const { displayName } = useUser();

  return (
    <RoomProvider>
      <GamePlayProvider>
        <div className="page">
          {/* Header (static at top) */}
          <div className="page--header">
            <div className="page--header-container">
              <GameHeader />
              <Features />
            </div>
          </div>

          {/* User Card: static on mobile, fixed on desktop; add mobile page padding */}
          <div className="page--padding">
            <UserDisplay displayName={displayName} />
          </div>

          {/* Main Content */}
          <div className="page--content">
            <div className="page--content-container">
              <RoomManager />
            </div>
          </div>
        </div>
      </GamePlayProvider>
    </RoomProvider>
  );
}
