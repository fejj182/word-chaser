'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { useUser } from '@/features/guest-auth/contexts/UserContext';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { Room, PartialRoom, RoomState, CreateRoomParams } from '@/features/room-management/types/room';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom, resolveRoomId } from '@/lib/firebase/room-utils';

type RoomAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_ROOM_ID'; payload: string }
  | { type: 'CLEAR_ROOM' };

const initialState: RoomState = {
  currentRoom: null,
  isLoading: false,
  error: null,
};

const roomReducer = (state: RoomState, action: RoomAction): RoomState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_ROOM_ID':
      return { ...state, currentRoom: { id: action.payload } as PartialRoom };
    case 'CLEAR_ROOM':
      return { ...state, currentRoom: null };
    default:
      return state;
  }
};

interface RoomContextType extends RoomState {
  createRoom: (params: CreateRoomParams, alias: string) => Promise<string>;
  joinRoom: (roomId: string, alias: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
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
  const [state, dispatch] = useReducer(roomReducer, initialState);
  const { user } = useAuth();
  const { setUser } = useUser();

  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  const handleCreateRoom = async (params: CreateRoomParams, alias: string): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);
      const displayName = alias.trim() || ensuredUser.displayName || 'Anonymous';
      const roomId = await createRoom(params, ensuredUser.uid, displayName);
      
      if (!roomId || roomId.trim() === '') {
        throw new Error('Invalid room ID received from server');
      }
      
      // Set the room ID to trigger the subscription
      dispatch({ type: 'SET_ROOM_ID', payload: roomId });
      return roomId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleJoinRoom = async (roomId: string, alias: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const ensuredUser = await ensureAnonymousWithAlias(alias);
      setUser(ensuredUser);
      const displayName = alias.trim() || ensuredUser.displayName || 'Anonymous';
      const resolvedRoomId = await resolveRoomId(roomId);
      await joinRoom(resolvedRoomId, ensuredUser.uid, displayName);
      // Set the room ID to trigger the subscription
      dispatch({ type: 'SET_ROOM_ID', payload: resolvedRoomId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleLeaveRoom = async (): Promise<void> => {
    if (!user || !state.currentRoom) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await leaveRoom(state.currentRoom.id, user.uid);
      dispatch({ type: 'CLEAR_ROOM' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Subscribe to room updates when currentRoom changes
  useEffect(() => {
    if (state.currentRoom && state.currentRoom.id) {
      const unsubscribe = subscribeToRoom(state.currentRoom.id, (room) => {
        dispatch({ type: 'SET_ROOM', payload: room });
      });
      
      return unsubscribe;
    }
  }, [state.currentRoom]);

  // Cleanup logic to prevent orphaned rooms
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
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    clearError,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
