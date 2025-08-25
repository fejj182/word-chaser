'use client';

import { SessionProvider } from '@/features/session-management/contexts/SessionContext';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { UserDisplay } from './UserDisplay';
import RoomManager from '@/features/room-management/components/RoomManager';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const AuthenticatedContent = () => {
  return (
    <SessionProvider>
      <RoomProvider>
        <div className="page">
          {/* Header (static at top) */}
          <div className="page--header">
            <div className="page--header-container">
              <GameHeader />
            </div>
          </div>

          {/* User Card: static on mobile, fixed on desktop; add mobile page padding */}
          <div className="page--padding">
            <UserDisplay />
          </div>

          {/* Main Content */}
          <div className="page--content">
            <div className="page--content-container">
              <RoomManager />
            </div>
          </div>
        </div>
      </RoomProvider>
    </SessionProvider>
  );
};
