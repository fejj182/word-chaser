'use client';

import { useState } from 'react';
import { signInAsGuest } from '@/lib/firebase/firebase-utils';

export const GuestSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleGuestSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { user: guestUser, error } = await signInAsGuest();
      
      if (error) {
        setError(error.message);
      } else if (guestUser) {
        // You can redirect or update UI state here
      }
    } catch (error) {
      console.error('Failed to sign in as guest:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in as guest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleGuestSignIn}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Play as Guest
      </button>
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};
