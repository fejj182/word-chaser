import { ref, push, set, get, onValue, off, update } from 'firebase/database';
import { db } from './firebase';
import { Room, Player, CreateRoomParams } from '@/features/room-management/types/room';
import { generateLetterGrid, getGridSizeConfig } from '@/lib/utils/grid-generation';
import { slugify, generateGlaswegianSlug } from '@/lib/utils/slug-utils';

const ROOMS_PATH = 'rooms';
const SLUGS_PATH = 'slugs';


async function generateUniqueGlaswegianSlug(): Promise<{ name: string; slug: string }> {
  let attempts = 0;
  while (attempts < 20) {
    attempts += 1;
    const slug = generateGlaswegianSlug();
    const slugRef = ref(db, `${SLUGS_PATH}/${slug}`);
    const existing = await get(slugRef);
    if (!existing.exists()) {
      return { name: slug, slug };
    }
  }
  // Fallback with timestamp to avoid infinite loop
  const fallback = `${generateGlaswegianSlug()}-${Date.now()}`;
  return { name: fallback, slug: fallback };
}

export const createRoom = async (params: CreateRoomParams, userId: string, displayName: string): Promise<string> => {
  const roomsRef = ref(db, ROOMS_PATH);
  const newRoomRef = push(roomsRef);
  const { name, slug } = await generateUniqueGlaswegianSlug();
  
  const room: Room = {
    id: newRoomRef.key!,
    name,
    slug,
    createdBy: userId,
    createdAt: Date.now(),
    status: 'waiting',
    players: {
      [userId]: {
        displayName,
        joinedAt: Date.now(),
        isHost: true,
        isReady: true,
        score: 0,
        wordsFound: 0,
      }
    },
    maxPlayers: params.maxPlayers,
    settings: params.settings,
  };

  await set(newRoomRef, room);
  await set(ref(db, `${SLUGS_PATH}/${slug}`), room.id);
  return room.id;
};

export const joinRoom = async (roomId: string, userId: string, displayName: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (Object.keys(room.players).length >= room.maxPlayers) {
    throw new Error('Room is full');
  }

  if (room.status !== 'waiting') {
    throw new Error('Game has already started');
  }

  const newPlayer: Player = {
    displayName,
    joinedAt: Date.now(),
    isHost: false,
    isReady: false,
    score: 0,
    wordsFound: 0,
  };

  const updates: Record<string, Player> = {};
  updates[`${ROOMS_PATH}/${roomId}/players/${userId}`] = newPlayer;
  
  await update(ref(db), updates);
};

export const resolveRoomId = async (roomKey: string): Promise<string> => {
  const trimmed = roomKey.trim();
  if (!trimmed) throw new Error('Room not found');

  const roomRef = ref(db, `${ROOMS_PATH}/${trimmed}`);
  const byId = await get(roomRef);
  if (byId.exists()) return trimmed;

  const slugRef = ref(db, `${SLUGS_PATH}/${slugify(trimmed)}`);
  const bySlug = await get(slugRef);
  if (bySlug.exists()) return bySlug.val();

  throw new Error('Room not found');
};

const deleteRoomAndSlug = async (roomRef: ReturnType<typeof ref>, room: Room): Promise<void> => {
  if (room.slug) {
    const slugRef = ref(db, `${SLUGS_PATH}/${room.slug}`);
    await set(slugRef, null);
  }
  await set(roomRef, null);
};


const removePlayerFromRoom = async (roomId: string, userId: string): Promise<void> => {
  const playerRef = ref(db, `${ROOMS_PATH}/${roomId}/players/${userId}`);
  await set(playerRef, null);
};

const makeFirstRemainingPlayerHost = async (roomId: string, remainingPlayers: Record<string, Player>): Promise<void> => {
  if (Object.keys(remainingPlayers).length > 0) {
    const firstPlayerId = Object.keys(remainingPlayers)[0];
    const hostRef = ref(db, `${ROOMS_PATH}/${roomId}/players/${firstPlayerId}/isHost`);
    await set(hostRef, true);
  }
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      return;
    }
  
    const room: Room = roomSnapshot.val();
    const { [userId]: leavingPlayer, ...updatedPlayers } = room.players;
    
    if (Object.keys(updatedPlayers).length === 0) {
      await deleteRoomAndSlug(roomRef, room);
    } else {
      if (leavingPlayer?.isHost) {
        await makeFirstRemainingPlayerHost(roomId, updatedPlayers);
      }
      await removePlayerFromRoom(roomId, userId);
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
  
  if (!room.players[userId]) {
    throw new Error('Player not found in room');
  }

  const updates: Record<string, boolean> = {};
  updates[`${ROOMS_PATH}/${roomId}/players/${userId}/isReady`] = isReady;
  
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

  const allReady = Object.values(room.players).every(p => p.isReady);
  if (!allReady) {
    throw new Error('Not all players are ready');
  }

  const gridSize = getGridSizeConfig(room.settings.gridSize);
  const grid = generateLetterGrid(gridSize);

  // Initialize timer for first round
  const roundDuration = room.settings.roundDuration * 1000; // Convert to ms
  const roundStartTime = Date.now();
  const roundEndTime = roundStartTime + roundDuration;

  const updates: Record<string, unknown> = {};
  updates[`${ROOMS_PATH}/${roomId}/status`] = 'playing';
  updates[`${ROOMS_PATH}/${roomId}/gameData`] = {
    grid,
    currentRound: 1,
    submittedWords: {},
    roundStartTime,
    roundEndTime,
    timerStatus: 'running'
  };
  
  await update(ref(db), updates);
};
