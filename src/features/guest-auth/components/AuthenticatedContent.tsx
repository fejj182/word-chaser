'use client';

import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { UserDisplay } from './UserDisplay';
import RoomManager from '@/features/room-management/components/RoomManager';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const AuthenticatedContent = () => {
  return (
    <RoomProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-8">
          <GameHeader />
          <UserDisplay />
          <RoomManager />
        </div>
      </div>
    </RoomProvider>
  );
};
