'use client';

import { GuestSignIn } from './GuestSignIn';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const UnauthenticatedContent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8">
        <GameHeader />
        <GuestSignIn />
      </div>
    </div>
  );
};
