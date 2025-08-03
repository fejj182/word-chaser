'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';

interface UserContextType {
  userId: string | null;
  displayName: string | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { user } = useAuth();

  // Update user ID when auth state changes
  useEffect(() => {
    if (user) {
      setUserId(user.uid);
      
      // Create display name for anonymous users
      if (user.isAnonymous) {
        const shortId = user.uid.substring(0, 8);
        setDisplayName(`Guest-${shortId}`);
      } else {
        setDisplayName(user.displayName || user.email || 'User');
      }
    } else {
      setUserId(null);
      setDisplayName(null);
    }
  }, [user]);

  const setUser = (user: User | null) => {
    if (user) {
      setUserId(user.uid);
      if (user.isAnonymous) {
        const shortId = user.uid.substring(0, 8);
        setDisplayName(`Guest-${shortId}`);
      } else {
        setDisplayName(user.displayName || user.email || 'User');
      }
    } else {
      setUserId(null);
      setDisplayName(null);
    }
  };

  return (
    <UserContext.Provider value={{ userId, displayName, setUser }}>
      {children}
    </UserContext.Provider>
  );
}; 