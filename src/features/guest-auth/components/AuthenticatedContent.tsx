'use client';

import { useUser } from '@/features/guest-auth/contexts/UserContext';
import { UserDisplay } from './UserDisplay';
import RoomManager from '@/features/room-management/components/RoomManager';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';
import { WordGridDemo } from '@/features/guest-auth/components/WordGridDemo';

export const AuthenticatedContent = () => {
  const { displayName } = useUser();

  return (
    <div className="page">
      {/* Header (static at top) */}
      <div className="page--header">
        <div className="page--header-container">
          <GameHeader />
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
          <WordGridDemo />
        </div>
      </div>
    </div>
  );
};
