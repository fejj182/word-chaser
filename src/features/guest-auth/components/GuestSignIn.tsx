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
        className="btn btn--primary btn--large btn--disabled"
      >
        Play as Guest
      </button>
      
      {error && (
        <p className="text--error">{error}</p>
      )}
    </div>
  );
};
