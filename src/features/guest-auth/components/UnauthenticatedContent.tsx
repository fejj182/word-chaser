'use client';

import { GuestSignIn } from './GuestSignIn';
import { GameHeader } from '@/features/guest-auth/components/GameHeader';

export const UnauthenticatedContent = () => {
  return (
    <div className="page">
      {/* Header (static at top) */}
      <div className="page--header">
        <div className="page--header-container">
          <GameHeader />
        </div>
      </div>

      {/* Main Content */}
      <div className="page--content">
        <div className="page--content-container--narrow">
          <GuestSignIn />
        </div>
      </div>
    </div>
  );
};
