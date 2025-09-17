import { adminDb } from './admin';
import { Room } from '@/features/room-management/types/room';

const ROOMS_PATH = 'rooms';

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
