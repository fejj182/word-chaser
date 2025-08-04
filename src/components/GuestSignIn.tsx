'use client';

import { useState } from 'react';
import { signInAsGuest } from '@/lib/firebase-utils';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { GuestSignInUI } from './GuestSignInUI';

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

  const handleStartGame = () => {
    window.location.reload();
  };

  return (
    <GuestSignInUI
      isLoading={isLoading}
      error={error}
      isSignedIn={!!(user && displayName)}
      displayName={displayName}
      onSignIn={handleGuestSignIn}
      onStartGame={handleStartGame}
    />
  );
};
