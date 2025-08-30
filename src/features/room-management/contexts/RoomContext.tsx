'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@/features/session-management/contexts/SessionContext';
import { 
  Session, 
  CreateSessionParams,
  SessionPlayer 
} from '@/features/session-management/types/session';
import { Room, PartialRoom, RoomState, CreateRoomParams, Player } from '@/features/room-management/types/room';

// Transform session data to room data
const transformSessionToRoom = (session: Session): Room => ({
  id: session.id,
  name: session.name,
  slug: session.name, // Using name as slug for now
  createdBy: session.players.find(p => p.isHost)?.id || '',
  createdAt: Date.now(), // We'll need to add this to session later
  status: session.status,
  players: session.players.map(transformSessionPlayerToPlayer),
  maxPlayers: session.maxPlayers,
  settings: session.settings,
});

const transformSessionPlayerToPlayer = (sessionPlayer: SessionPlayer): Player => ({
  id: sessionPlayer.id,
  displayName: sessionPlayer.displayName,
  joinedAt: Date.now(), // We'll need to add this to session later
  isHost: sessionPlayer.isHost,
  isReady: sessionPlayer.isReady,
});

const transformRoomParamsToSessionParams = (roomParams: CreateRoomParams): CreateSessionParams => ({
  maxPlayers: roomParams.maxPlayers,
  settings: roomParams.settings,
});

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
  const session = useSession();

  // Transform session state to room state
  const roomState: RoomState = {
    currentRoom: session.currentSession 
      ? (session.currentSession.id && 'players' in session.currentSession 
          ? transformSessionToRoom(session.currentSession as Session)
          : { id: session.currentSession.id } as PartialRoom)
      : null,
    isLoading: session.isLoading,
    error: session.error,
  };

  // Transform session methods to room methods
  const createRoom = async (params: CreateRoomParams, alias: string): Promise<string> => {
    const sessionParams = transformRoomParamsToSessionParams(params);
    return session.createSession(sessionParams, alias);
  };

  const loadRoom = async (roomId: string): Promise<void> => {
    return session.loadSession(roomId);
  };

  const joinRoom = async (roomId: string, alias: string): Promise<void> => {
    return session.joinSession(roomId, alias);
  };

  const leaveRoom = async (): Promise<void> => {
    return session.leaveSession();
  };

  const updatePlayerReady = async (isReady: boolean): Promise<void> => {
    return session.setPlayerReady(isReady);
  };

  const startGame = async (): Promise<void> => {
    return session.startSession();
  };

  const clearError = (): void => {
    session.clearError();
  };

  const value: RoomContextType = {
    ...roomState,
    createRoom,
    loadRoom,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    startGame,
    clearError,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
