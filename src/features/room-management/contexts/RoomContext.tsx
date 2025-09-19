'use client';

import React, { createContext, useContext, ReactNode, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  subscribeToRoom,
  resolveRoomId, 
  updatePlayerReady, 
  startGame 
} from '@/lib/firebase/room-utils';
import { Room, RoomState, CreateRoomParams } from '@/features/room-management/types/room';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { useUser } from '@/features/user-management/contexts/UserContext';

// Reducer actions
type RoomAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_ROOM_ID'; payload: string }
  | { type: 'CLEAR_ROOM' };

const initialState: RoomState = {
  currentRoom: null,
  roomId: null,
  isLoading: false,
  error: null,
};

// Reducer function
const roomReducer = (state: RoomState, action: RoomAction): RoomState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_ROOM_ID':
      return { ...state, roomId: action.payload };
    case 'CLEAR_ROOM':
      return { ...state, currentRoom: null, roomId: null };
    default:
      return state;
  }
};

interface RoomContextType extends RoomState {
  createRoom: (params: CreateRoomParams, alias: string) => Promise<string>;
  loadRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string, alias: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updatePlayerReady: (isReady: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { setUser } = useUser();
  const [state, dispatch] = useReducer(roomReducer, initialState);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const createRoomHandler = useCallback(async (params: CreateRoomParams, alias: string): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);

      const roomId = await createRoom(params, ensuredUser.uid, alias.trim());
      
      if (!roomId || roomId.trim() === '') {
        throw new Error('Invalid room ID received from server');
      }
      
      // Set the room ID to trigger the subscription
      dispatch({ type: 'SET_ROOM_ID', payload: roomId });
      return roomId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.uid]);

  const joinRoomHandler = useCallback(async (roomId: string, alias: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);
      const resolvedRoomId = await resolveRoomId(roomId);
      await joinRoom(resolvedRoomId, ensuredUser.uid, alias.trim());
      
      // Set the room ID to trigger the subscription
      dispatch({ type: 'SET_ROOM_ID', payload: resolvedRoomId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.uid]);

  const leaveRoomHandler = useCallback(async (): Promise<void> => {
    if (!state.currentRoom || !user) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await leaveRoom(state.currentRoom.id, user.uid);
      
      // Clear the room and room ID
      dispatch({ type: 'CLEAR_ROOM' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentRoom?.id, user?.uid]);

  const loadSessionHandler = useCallback(async (sessionId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const resolvedSessionId = await resolveRoomId(sessionId);
      dispatch({ type: 'SET_ROOM_ID', payload: resolvedSessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentRoom?.id, user?.uid]);


  const updatePlayerReadyHandler = useCallback(async (isReady: boolean): Promise<void> => {
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      if (!state.currentRoom || !user) {
        throw new Error('No room or user');
      }

      await updatePlayerReady(state.currentRoom.id, user.uid, isReady);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ready status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, [state.currentRoom?.id, user?.uid]);

  const startGameHandler = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      if (!state.currentRoom) {
        throw new Error('No room');
      }

      await startGame(state.currentRoom.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, [state.currentRoom?.id]);

  // Effect to handle room subscription when roomId changes
  useEffect(() => {
    if (state.roomId) {
      const unsubscribe = subscribeToRoom(state.roomId, (room) => {
        dispatch({ type: 'SET_ROOM', payload: room });
      });      
      // Return cleanup function
      return unsubscribe;
    }
  }, [state.roomId]);

  useEffect(() => {
    if (!state.currentRoom?.id || !user?.uid) {
      return;
    }

    const handleBeforeUnload = () => {
      if (state.currentRoom?.id && user?.uid) {
        // Use sendBeacon for reliable cleanup on page unload
        const data = JSON.stringify({
          roomId: state.currentRoom.id,
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
      if (document.visibilityState === 'hidden' && state.currentRoom?.id && user?.uid) {
        console.log('Page hidden - user may have navigated away');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.currentRoom?.id, user?.uid]);

  const value: RoomContextType = {
    ...state,
    createRoom: createRoomHandler,
    joinRoom: joinRoomHandler,
    leaveRoom: leaveRoomHandler,
    loadRoom: loadSessionHandler,
    updatePlayerReady: updatePlayerReadyHandler,
    startGame: startGameHandler,
    clearError,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
