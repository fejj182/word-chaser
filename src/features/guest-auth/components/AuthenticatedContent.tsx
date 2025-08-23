'use client';

import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { UserDisplay } from './UserDisplay';
import RoomManager from '@/features/room-management/components/RoomManager';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const AuthenticatedContent = () => {
  return (
    <RoomProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header (static at top) */}
        <div className="pt-4 md:pt-8 pb-3 md:pb-4">
          <div className="text-center px-4">
            <GameHeader />
          </div>
        </div>

        {/* User Card: static on mobile, fixed on desktop; add mobile page padding */}
        <div className="px-4">
          <UserDisplay />
        </div>

        {/* Main Content */}
        <div className="flex items-start justify-center px-4 pb-10">
          <div className="text-center p-6 md:p-8 w-full max-w-3xl">
            <RoomManager />
          </div>
        </div>
      </div>
    </RoomProvider>
  );
};
