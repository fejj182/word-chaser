import { adminDb } from './admin';
import { Room, SubmittedWord } from '@/features/room-management/types/room';

const ROOMS_PATH = 'rooms';

/**
 * Server-side function to get room data using Firebase Admin SDK
 * This bypasses security rules since it runs with admin privileges
 */
export const getRoom = async (roomId: string): Promise<Room | null> => {
  const roomRef = adminDb.ref(`${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  
  if (!roomSnapshot.exists()) {
    return null;
  }

  return roomSnapshot.val();
};

/**
 * Server-side function to update player score using Firebase Admin SDK
 * This bypasses security rules since it runs with admin privileges
 */
export const updatePlayerScoreAdmin = async (
  roomId: string, 
  userId: string, 
  wordScore: number
): Promise<void> => {
  const roomRef = adminDb.ref(`${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (!room.players[userId]) {
    throw new Error('Player not found in room');
  }

  const currentPlayer = room.players[userId];
  const newScore = currentPlayer.score + wordScore;
  const newWordsFound = currentPlayer.wordsFound + 1;

  // Update both score and wordsFound in a single transaction
  await roomRef.child(`players/${userId}`).update({
    score: newScore,
    wordsFound: newWordsFound
  });
};

/**
 * Server-side function to add a submitted word to the room's global list
 * This bypasses security rules since it runs with admin privileges
 */
export const addSubmittedWordAdmin = async (
  roomId: string,
  word: string,
  playerId: string,
  playerName: string,
  score: number
): Promise<void> => {
  const roomRef = adminDb.ref(`${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (!room.players[playerId]) {
    throw new Error('Player not found in room');
  }

  // Check if word already exists (case-insensitive)
  const existingWords = room.gameData?.submittedWords || {};
  const wordKey = word.toUpperCase();
  
  if (existingWords[wordKey]) {
    throw new Error('Word has already been submitted');
  }

  const submittedWord: SubmittedWord = {
    word: word.toUpperCase(),
    playerId,
    playerName,
    score,
    submittedAt: Date.now()
  };

  // Add the word to the submitted words list
  await roomRef.child(`gameData/submittedWords/${wordKey}`).set(submittedWord);
};

/**
 * Server-side function to check if a word has already been submitted
 * This bypasses security rules since it runs with admin privileges
 */
export const isWordAlreadySubmittedAdmin = async (
  roomId: string,
  word: string
): Promise<boolean> => {
  const roomRef = adminDb.ref(`${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  const existingWords = room.gameData?.submittedWords || {};
  const wordKey = word.toUpperCase();
  
  return !!existingWords[wordKey];
};

/**
 * Server-side function to remove a player from a room using Firebase Admin SDK
 * This bypasses security rules since it runs with admin privileges
 * Used for cleanup operations when user is no longer authenticated (browser close, etc.)
 */
export const leaveRoomAdmin = async (roomId: string, userId: string): Promise<void> => {
  const roomRef = adminDb.ref(`${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  
  if (!roomSnapshot.exists()) {
    return;
  }

  const room: Room = roomSnapshot.val();
  const { [userId]: leavingPlayer, ...updatedPlayers } = room.players;
  
  if (Object.keys(updatedPlayers).length === 0) {
    // Delete room and slug when last player leaves
    await roomRef.remove();
    if (room.slug) {
      await adminDb.ref(`slugs/${room.slug}`).remove();
    }
  } else {
    if (leavingPlayer?.isHost) {
      // Transfer host to first remaining player
      const firstRemainingPlayerId = Object.keys(updatedPlayers)[0];
      await adminDb.ref(`${ROOMS_PATH}/${roomId}/players/${firstRemainingPlayerId}/isHost`).set(true);
    }
    // Remove the leaving player
    await adminDb.ref(`${ROOMS_PATH}/${roomId}/players/${userId}`).remove();
  }
};
