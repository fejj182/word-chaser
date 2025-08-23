'use client';

import { GuestSignIn } from './GuestSignIn';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const UnauthenticatedContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header (static at top) */}
      <div className="pt-4 md:pt-8 pb-3 md:pb-4">
        <div className="text-center px-4">
          <GameHeader />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-center px-4 pb-10">
        <div className="text-center p-6 md:p-8 w-full max-w-2xl">
          <GuestSignIn />
        </div>
      </div>
    </div>
  );
};
