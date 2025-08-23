'use client';

import { useUser } from '@/features/guest-auth/contexts/UserContext';

export const UserDisplay = () => {
  const { displayName, userId } = useUser();

  if (!displayName || !userId) {
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
        <div className="container--id-display">
          <p className="text--subtitle">
            Share this ID:
          </p>
          <p className="text--mono">
            {userId}
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(userId);
              // You could add a toast notification here
            } catch (err) {
              console.error('Failed to copy:', err);
            }
          }}
          className="btn btn--primary btn--full btn--small spacing--button-top"
        >
          Copy ID
        </button>
      </div>
    </div>
  );
}; 