'use client';

import { useUser } from '@/features/guest-auth/contexts/UserContext';

export const UserDisplay = () => {
  const { displayName, userId } = useUser();

  if (!displayName || !userId) {
    return null;
  }

  return (
    <div className="md:fixed md:top-4 md:right-4 md:z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-4 border border-gray-200 dark:border-gray-700 max-w-md md:max-w-sm mx-auto md:mx-0">
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Playing as:
        </p>
        <p className="font-bold text-base md:text-lg text-blue-600 dark:text-blue-400 mb-2">
          {displayName}
        </p>
        <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Share this ID:
          </p>
          <p className="font-mono text-xs md:text-sm text-gray-800 dark:text-gray-200 break-all">
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
          className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Copy ID
        </button>
      </div>
    </div>
  );
}; 