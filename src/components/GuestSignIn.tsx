'use client';

import { useState } from 'react';
import { signInAsGuest } from '@/lib/firebase-utils';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';

export const GuestSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { displayName } = useUser();

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: guestUser, error } = await signInAsGuest();
      
      if (error) {
        setError(error.message);
      } else if (guestUser) {
        // You can redirect or update UI state here
      }
    } catch (err) {
      setError('Failed to sign in as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show user info if signed in, otherwise show sign-in button
  if (user && displayName) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome!
          </h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            <p className="text-xl font-semibold">{displayName}</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleGuestSignIn}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Signing in...' : 'Play as Guest'}
      </button>
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}; 