import { Room, Player, SubmittedWord } from '@/features/room-management/types/room';
import { RoundResult } from '@/features/room-management/types/room';

/**
 * Test utilities for creating mock room data and simulating round scenarios
 */

// Internal helper functions (not exported as they're only used internally)
const createMockPlayer = (id: string, displayName: string, score: number = 0): Player => ({
  displayName,
  score,
  joinedAt: Date.now(),
  isHost: id === 'host-123',
  isReady: true,
  wordsFound: 0,
});

const createMockSubmittedWord = (
  word: string,
  path: number[][],
  score: number,
  playerId: string,
  playerName: string = 'Test Player'
): SubmittedWord => ({
  word,
  playerId,
  playerName,
  score,
  submittedAt: Date.now(),
});

export const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'test-room-123',
  name: 'Test Room',
  slug: 'test-room',
  createdBy: 'host-123',
  createdAt: Date.now(),
  status: 'playing',
  maxPlayers: 4,
  players: {
    'host-123': createMockPlayer('host-123', 'Host Player', 0),
    'player-456': createMockPlayer('player-456', 'Test Player', 0),
  },
  settings: {
    roundDuration: 60, // 60 seconds
    maxRounds: 3,
    gridSize: 'small' as const,
  },
  gameData: {
    grid: [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
      ['I', 'J', 'K', 'L'],
      ['M', 'N', 'O', 'P'],
    ],
    currentRound: 1,
    submittedWords: {},
    roundStartTime: Date.now(),
    roundEndTime: Date.now() + 60000, // 60 seconds from now
    timerStatus: 'running',
    roundResults: {},
  },
  ...overrides,
});

export const createMockRoomWithExpiredTimer = (): Room => {
  const room = createMockRoom();
  return {
    ...room,
    gameData: {
      ...room.gameData!,
      roundEndTime: Date.now() - 1000, // Timer expired 1 second ago
      timerStatus: 'running' as const,
    },
  };
};

export const createMockRoomWithSubmittedWords = (): Room => {
  const room = createMockRoom();
  return {
    ...room,
    gameData: {
      ...room.gameData!,
      submittedWords: {
        'host-123-cat': createMockSubmittedWord('CAT', [[0, 0], [0, 1], [0, 2]], 3, 'host-123', 'Host Player'),
        'host-123-dog': createMockSubmittedWord('DOG', [[1, 0], [1, 1], [1, 2]], 3, 'host-123', 'Host Player'),
        'player-456-bat': createMockSubmittedWord('BAT', [[0, 0], [1, 0], [2, 0]], 3, 'player-456', 'Test Player'),
      },
    },
  };
};

export const createMockRoundResult = (roundNumber: number): RoundResult => ({
  roundNumber,
  roundScores: {
    'host-123': 6,
    'player-456': 3,
  },
  roundWords: {
    'host-123': [
      createMockSubmittedWord('CAT', [[0, 0], [0, 1], [0, 2]], 3, 'host-123', 'Host Player'),
      createMockSubmittedWord('DOG', [[1, 0], [1, 1], [1, 2]], 3, 'host-123', 'Host Player'),
    ],
    'player-456': [
      createMockSubmittedWord('BAT', [[0, 0], [1, 0], [2, 0]], 3, 'player-456', 'Test Player'),
    ],
  },
  roundWinner: {
    playerId: 'host-123',
    playerName: 'Host Player',
    score: 6,
  },
});

export const createMockRoomWithRoundResults = (): Room => {
  const room = createMockRoom();
  return {
    ...room,
    gameData: {
      ...room.gameData!,
      currentRound: 2,
      roundResults: {
        1: createMockRoundResult(1),
      },
    },
  };
};

export const createMockRoomInFinalRound = (): Room => {
  const room = createMockRoom();
  return {
    ...room,
    gameData: {
      ...room.gameData!,
      currentRound: 3, // Final round
      roundResults: {
        1: createMockRoundResult(1),
        2: createMockRoundResult(2),
      },
    },
  };
};


/**
 * Test scenarios for different round states
 */
export const roundTestScenarios = {
  // Room with timer about to expire
  timerExpiring: () => createMockRoom({
    gameData: {
      ...createMockRoom().gameData!,
      roundEndTime: Date.now() + 1000, // 1 second left
    },
  }),

  // Room with timer already expired
  timerExpired: () => createMockRoomWithExpiredTimer(),

  // Room with no submitted words
  noWordsSubmitted: () => createMockRoom(),

  // Room with words submitted
  wordsSubmitted: () => createMockRoomWithSubmittedWords(),

  // Room between rounds
  betweenRounds: () => createMockRoomWithRoundResults(),

  // Room in final round
  finalRound: () => createMockRoomInFinalRound(),

  // Room with paused timer
  timerPaused: () => createMockRoom({
    gameData: {
      ...createMockRoom().gameData!,
      timerStatus: 'paused' as const,
    },
  }),

  // Room with ended timer
  timerEnded: () => createMockRoom({
    gameData: {
      ...createMockRoom().gameData!,
      timerStatus: 'ended' as const,
    },
  }),
};
