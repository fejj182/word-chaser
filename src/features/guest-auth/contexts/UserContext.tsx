'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';

interface UserContextType {
  userId: string | null;
  displayName: string | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Export the context for stories and testing
export { UserContext };

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
      if (user.displayName && user.displayName.trim().length > 0) {
        setDisplayName(user.displayName);
      } else {
        setDisplayName(null);
      }
    } else {
      setUserId(null);
      setDisplayName(null);
    }
  }, [user]);

  const setUser = (user: User | null) => {
    if (user) {
      setUserId(user.uid);
      if (user.displayName && user.displayName.trim().length > 0) {
        setDisplayName(user.displayName);
      } else {
        setDisplayName(null);
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