'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { useUser } from '@/features/guest-auth/contexts/UserContext';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { 
  Session, 
  PartialSession, 
  SessionState, 
  CreateSessionParams,
  SessionManager 
} from '@/features/session-management/types/session';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom, resolveRoomId, updatePlayerReady, startGame } from '@/lib/firebase/room-utils';

type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'CLEAR_SESSION' };

const initialState: SessionState = {
  currentSession: null,
  isLoading: false,
  error: null,
};

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, currentSession: { id: action.payload } as PartialSession };
    case 'CLEAR_SESSION':
      return { ...state, currentSession: null };
    default:
      return state;
  }
};

interface SessionContextType extends SessionState, SessionManager {
  clearError: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { user } = useAuth();
  const { setUser } = useUser();

  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  const createSession = async (params: CreateSessionParams, alias: string): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);
      const displayName = alias.trim() || ensuredUser.displayName || 'Anonymous';
      const sessionId = await createRoom(params, ensuredUser.uid, displayName);
      
      if (!sessionId || sessionId.trim() === '') {
        throw new Error('Invalid session ID received from server');
      }
      
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      return sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const joinSession = async (sessionId: string, alias: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);
      const displayName = alias.trim() || ensuredUser.displayName || 'Anonymous';
      const resolvedSessionId = await resolveRoomId(sessionId);
      await joinRoom(resolvedSessionId, ensuredUser.uid, displayName);
      dispatch({ type: 'SET_SESSION_ID', payload: resolvedSessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const leaveSession = async (): Promise<void> => {
    if (!user || !state.currentSession) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await leaveRoom(state.currentSession.id, user.uid);
      dispatch({ type: 'CLEAR_SESSION' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setPlayerReady = async (isReady: boolean): Promise<void> => {
    if (!user || !state.currentSession) {
      throw new Error('No active session');
    }

    try {
      await updatePlayerReady(state.currentSession.id, user.uid, isReady);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ready status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const startSession = async (): Promise<void> => {
    if (!state.currentSession) {
      throw new Error('No active session');
    }

    try {
      await startGame(state.currentSession.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const subscribeToSession = (callback: (session: Session | null) => void): () => void => {
    if (!state.currentSession) {
      return () => {};
    }
    
    return subscribeToRoom(state.currentSession.id, (room) => {
      // Transform room data to session data
      if (room) {
        const session: Session = {
          id: room.id,
          name: room.name,
          status: room.status,
          players: room.players.map(player => ({
            id: player.id,
            displayName: player.displayName,
            isHost: player.isHost,
            isReady: player.isReady,
          })),
          maxPlayers: room.maxPlayers,
          settings: room.settings,
        };
        callback(session);
      } else {
        callback(null);
      }
    });
  };

  // Subscribe to session updates when currentSession changes
  useEffect(() => {
    if (state.currentSession && state.currentSession.id) {
      const unsubscribe = subscribeToSession((session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
      });
      
      return unsubscribe;
    }
  }, [state.currentSession]);

  // Cleanup logic to prevent orphaned sessions
  useEffect(() => {
    if (!state.currentSession?.id || !user?.uid) {
      return;
    }

    const handleBeforeUnload = () => {
      if (state.currentSession?.id && user?.uid) {
        const data = JSON.stringify({
          roomId: state.currentSession.id,
          userId: user.uid
        });
        
        try {
          navigator.sendBeacon('/api/leave-room', data);
        } catch (error) {
          console.warn('Failed to send cleanup request:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.currentSession?.id && user?.uid) {
        console.log('Page hidden - user may have navigated away');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.currentSession?.id, user?.uid]);

  const value: SessionContextType = {
    ...state,
    createSession,
    joinSession,
    leaveSession,
    setPlayerReady,
    startSession,
    subscribeToSession,
    clearError,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
