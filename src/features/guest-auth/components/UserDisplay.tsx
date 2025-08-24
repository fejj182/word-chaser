'use client';

import { useUser } from '@/features/guest-auth/contexts/UserContext';

export const UserDisplay = () => {
  const { displayName } = useUser();

  if (!displayName) {
    return null;
  }

  return (
    <div className="card card--user card--user-desktop">
      <div className="container--centered">
        <p className="text--label">
          Playing as:
        </p>
        <p className="text--heading">
          {displayName}
        </p>
      </div>
    </div>
  );
}; 