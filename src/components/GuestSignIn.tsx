'use client';

import { useState } from 'react';
import { signInAsGuest } from '@/lib/firebase-utils';
import { useAuth } from '@/hooks/useAuth';

export const GuestSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { user: guestUser, error } = await signInAsGuest();
      
      if (error) {
        setError(error.message);
      } else if (guestUser) {
        console.log('Signed in as guest:', guestUser.uid);
        // You can redirect or update UI state here
      }
    } catch (err) {
      setError('Failed to sign in as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show the button if user is already signed in
  if (user) {
    return null;
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