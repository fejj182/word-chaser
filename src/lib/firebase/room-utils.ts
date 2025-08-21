import { ref, push, set, get, onValue, off, update } from 'firebase/database';
import { db } from './firebase';
import { Room, Player, CreateRoomParams } from '@/features/room-management/types/room';

const ROOMS_PATH = 'rooms';

export const createRoom = async (params: CreateRoomParams, userId: string, displayName: string): Promise<string> => {
  const roomsRef = ref(db, ROOMS_PATH);
  const newRoomRef = push(roomsRef);
  
  const room: Room = {
    id: newRoomRef.key!,
    name: params.name,
    createdBy: userId,
    createdAt: Date.now(),
    status: 'waiting',
    players: [{
      id: userId,
      displayName,
      joinedAt: Date.now(),
      isHost: true,
      isReady: true,
    }],
    maxPlayers: params.maxPlayers,
    settings: params.settings,
  };

  await set(newRoomRef, room);
  return room.id;
};

export const joinRoom = async (roomId: string, userId: string, displayName: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (room.players.length >= room.maxPlayers) {
    throw new Error('Room is full');
  }

  if (room.status !== 'waiting') {
    throw new Error('Game has already started');
  }

  const newPlayer: Player = {
    id: userId,
    displayName,
    joinedAt: Date.now(),
    isHost: false,
    isReady: false,
  };

  const updates: Record<string, any> = {};
  updates[`${ROOMS_PATH}/${roomId}/players/${room.players.length}`] = newPlayer;
  
  await update(ref(db), updates);
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      return;
    }
  
    const room: Room = roomSnapshot.val();
    const updatedPlayers = room.players.filter(player => player.id !== userId);
    
    if (updatedPlayers.length === 0) {
      // Delete room if no players left
      await set(roomRef, null);
    } else {
      // If the host left, make the first remaining player the host
      if (room.players.find(p => p.id === userId)?.isHost && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;  // ← Fix: Update the array directly
      }
      
      // Update players array
      const updates: Record<string, any> = {};
      updates[`${ROOMS_PATH}/${roomId}/players`] = updatedPlayers;
      
      await update(ref(db), updates);
    }
};

export const subscribeToRoom = (roomId: string, callback: (room: Room | null) => void): () => void => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return () => {
    off(roomRef);
    unsubscribe();
  };
};

export const updatePlayerReady = async (roomId: string, userId: string, isReady: boolean): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  const playerIndex = room.players.findIndex(p => p.id === userId);
  
  if (playerIndex === -1) {
    throw new Error('Player not found in room');
  }

  const updates: Record<string, any> = {};
  updates[`${ROOMS_PATH}/${roomId}/players/${playerIndex}/isReady`] = isReady;
  
  await update(ref(db), updates);
};

export const startGame = async (roomId: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (room.status !== 'waiting') {
    throw new Error('Game has already started');
  }

  const allReady = room.players.every(p => p.isReady);
  if (!allReady) {
    throw new Error('Not all players are ready');
  }

  const updates: Record<string, any> = {};
  updates[`${ROOMS_PATH}/${roomId}/status`] = 'playing';
  
  await update(ref(db), updates);
};
