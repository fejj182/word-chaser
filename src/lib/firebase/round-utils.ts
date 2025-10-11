import { ref, get, update } from 'firebase/database';
import { db } from './firebase';
import { Room, RoundResult, SubmittedWord, Player } from '@/features/room-management/types/room';
import { generateLetterGrid, getGridSizeConfig } from '@/lib/utils/grid-generation';

const ROOMS_PATH = 'rooms';

export const startRoundTimer = async (roomId: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (room.status !== 'playing') {
    throw new Error('Room is not in playing state');
  }

  const roundDuration = room.settings.roundDuration * 1000; // Convert to ms
  const roundStartTime = Date.now();
  const roundEndTime = roundStartTime + roundDuration;

  const updates: Record<string, unknown> = {};
  updates[`${ROOMS_PATH}/${roomId}/gameData/roundStartTime`] = roundStartTime;
  updates[`${ROOMS_PATH}/${roomId}/gameData/roundEndTime`] = roundEndTime;
  updates[`${ROOMS_PATH}/${roomId}/gameData/timerStatus`] = 'running';
  
  await update(ref(db), updates);
};

export const endCurrentRound = async (roomId: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (!room || room.status !== 'playing') {
    throw new Error('Room is not in playing state');
  }

  const currentRound = room.gameData?.currentRound || 1;
  const maxRounds = room.settings.maxRounds;

  const roundResults = calculateRoundResults(room, currentRound);

  const updates: Record<string, unknown> = {};
  updates[`${ROOMS_PATH}/${roomId}/gameData/roundResults/round-${currentRound}`] = roundResults;
  updates[`${ROOMS_PATH}/${roomId}/gameData/timerStatus`] = 'ended';

  // Check if game should end
  if (currentRound >= maxRounds) {
    const gameWinner = determineGameWinner(room.players);
    updates[`${ROOMS_PATH}/${roomId}/status`] = 'finished';
    if (gameWinner) {
      updates[`${ROOMS_PATH}/${roomId}/gameData/gameWinner`] = gameWinner;
    }
  } else {
    // Schedule next round to start after 5 seconds
    setTimeout(() => {
      startNextRound(roomId).catch(console.error);
    }, 5000);
  }

  await update(ref(db), updates);
};

export const startNextRound = async (roomId: string): Promise<void> => {
  const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
  const roomSnapshot = await get(roomRef);
  
  if (!roomSnapshot.exists()) {
    throw new Error('Room not found');
  }

  const room: Room = roomSnapshot.val();
  
  if (!room || room.status !== 'playing') {
    throw new Error('Room is not in playing state');
  }

  const currentRound = room.gameData?.currentRound || 1;
  const maxRounds = room.settings.maxRounds;

  // Don't start next round if we've reached the max
  if (currentRound >= maxRounds) {
    return;
  }

  const nextRound = currentRound + 1;
  const roundDuration = room.settings.roundDuration * 1000;
  const roundStartTime = Date.now();
  const roundEndTime = roundStartTime + roundDuration;

  // Generate new grid for next round
  const gridSize = getGridSizeConfig(room.settings.gridSize);
  const newGrid = generateLetterGrid(gridSize);

  const updates: Record<string, unknown> = {};
  updates[`${ROOMS_PATH}/${roomId}/gameData/currentRound`] = nextRound;
  updates[`${ROOMS_PATH}/${roomId}/gameData/roundStartTime`] = roundStartTime;
  updates[`${ROOMS_PATH}/${roomId}/gameData/roundEndTime`] = roundEndTime;
  updates[`${ROOMS_PATH}/${roomId}/gameData/timerStatus`] = 'running';
  updates[`${ROOMS_PATH}/${roomId}/gameData/submittedWords`] = {}; // Reset for new round
  updates[`${ROOMS_PATH}/${roomId}/gameData/grid`] = newGrid; // New grid for next round

  await update(ref(db), updates);
};

export const calculateRoundResults = (room: Room, roundNumber: number): RoundResult => {
  const submittedWords = room.gameData?.submittedWords || {};
  const players = room.players;

  const roundWords: Record<string, SubmittedWord[]> = {};
  const roundScores: Record<string, number> = {};

  // Initialize scores for all players
  Object.keys(players).forEach(playerId => {
    roundWords[playerId] = [];
    roundScores[playerId] = 0;
  });

  // Calculate round scores from submitted words
  Object.values(submittedWords).forEach(word => {
    const playerId = word.playerId;
    if (roundWords[playerId]) {
      roundWords[playerId].push(word);
      roundScores[playerId] += word.score;
    }
  });

  let roundWinner: RoundResult['roundWinner'] | null = null;
  const sortedPlayers = Object.entries(roundScores)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedPlayers.length > 0 && sortedPlayers[0][1] > 0) {
    const [winnerId, winnerScore] = sortedPlayers[0];
    const winnerPlayer = players[winnerId];
    
    // Check if there's a tie for first place
    const tiedPlayers = sortedPlayers.filter(([, score]) => score === winnerScore);
    
    if (tiedPlayers.length === 1) {
      roundWinner = {
        playerId: winnerId,
        playerName: winnerPlayer.displayName,
        score: winnerScore
      };
    }
  }

  return {
    roundNumber,
    roundScores,
    roundWords,
    roundWinner
  };
};


export const shouldRoundEnd = (room: Room): boolean => {
  if (!room.gameData?.roundEndTime || room.gameData.timerStatus !== 'running') {
    return false;
  }
  
  return Date.now() >= room.gameData.roundEndTime;
};

export const getRemainingTime = (room: Room): number => {
  if (!room.gameData?.roundEndTime || room.gameData.timerStatus !== 'running') {
    return 0;
  }
  
  return Math.max(0, Math.ceil((room.gameData.roundEndTime - Date.now()) / 1000));
};

export const determineGameWinner = (players: Record<string, Player>): {
  playerId: string;
  playerName: string;
  finalScore: number;
} | null => {
  const playerScores = Object.entries(players).map(([playerId, player]) => ({
    playerId,
    playerName: player.displayName,
    finalScore: player.score
  }));

  if (playerScores.length === 0) {
    return null;
  }

  // Sort by score (highest first)
  const sortedPlayers = playerScores.sort((a, b) => b.finalScore - a.finalScore);
  
  // Check if there's a clear winner (no tie for first place)
  const topScore = sortedPlayers[0].finalScore;
  const tiedPlayers = sortedPlayers.filter(p => p.finalScore === topScore);
  
  if (tiedPlayers.length === 1 && topScore > 0) {
    return sortedPlayers[0];
  }
  
  return null; // No winner (tie or all scores are 0)
};
