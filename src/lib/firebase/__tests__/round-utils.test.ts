import {
  startRoundTimer,
  endCurrentRound,
  startNextRound,
  calculateRoundResults,
  shouldRoundEnd,
  getRemainingTime,
  determineGameWinner,
} from '../round-utils';
import {
  createMockRoom,
  createMockRoomWithExpiredTimer,
  createMockRoomWithSubmittedWords,
  createMockRoomInFinalRound,
} from '@/features/game-play/test-utils/round-test-utils';

// Mock Firebase
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  set: jest.fn(),
}));

import { ref, get, update } from 'firebase/database';

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockGet = get as jest.MockedFunction<typeof get>;
const mockUpdate = update as jest.MockedFunction<typeof update>;

describe('round-utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startRoundTimer', () => {
    it('should start a round timer with correct timing', async () => {
      const roomId = 'test-room';
      const room = createMockRoom();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await startRoundTimer(roomId);

      expect(mockRef).toHaveBeenCalledWith({}, `rooms/${roomId}`);
      expect(mockGet).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();

      const updateCall = mockUpdate.mock.calls[0][1]; // Second argument is the updates object
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/roundStartTime');
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/roundEndTime');
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/timerStatus', 'running');
    });

    it('should throw error if room does not exist', async () => {
      const roomId = 'non-existent-room';
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(startRoundTimer(roomId)).rejects.toThrow('Room not found');
    });
  });

  describe('endCurrentRound', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should end current round and calculate results', async () => {
      const roomId = 'test-room';
      const room = createMockRoomWithSubmittedWords();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await endCurrentRound(roomId);

      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0][1]; // Second argument is the updates object
      
      // Should save round results as an object
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/roundResults/round-1');
      // Should set timer status to 'ended' (not start next round immediately)
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/timerStatus', 'ended');
    });

    it('should schedule next round start after 5 seconds if not final round', async () => {
      const roomId = 'test-room';
      const room = createMockRoomWithSubmittedWords();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await endCurrentRound(roomId);

      // Should not start next round immediately
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updateCall = mockUpdate.mock.calls[0][1];
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/timerStatus', 'ended');
      expect(updateCall).not.toHaveProperty('rooms/test-room/gameData/currentRound', 2);

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000);
      await Promise.resolve(); // Allow setTimeout to execute

      // Should now start next round
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      const nextRoundCall = mockUpdate.mock.calls[1][1];
      expect(nextRoundCall).toHaveProperty('rooms/test-room/gameData/currentRound', 2);
      expect(nextRoundCall).toHaveProperty('rooms/test-room/gameData/timerStatus', 'running');
    });

    it('should end game if final round', async () => {
      const roomId = 'test-room';
      const room = createMockRoomInFinalRound();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await endCurrentRound(roomId);

      const updateCall = mockUpdate.mock.calls[0][1]; // Second argument is the updates object
      
      // Should end game
      expect(updateCall).toHaveProperty('rooms/test-room/status', 'finished');
      // Should not start next round
      expect(updateCall).not.toHaveProperty('rooms/test-room/gameData/currentRound');
    });
  });

  describe('startNextRound', () => {
    it('should start next round with new grid and timer', async () => {
      const roomId = 'test-room';
      const room = createMockRoomWithSubmittedWords();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await startNextRound(roomId);

      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0][1];
      
      // Should start next round
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/currentRound', 2);
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/roundStartTime');
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/roundEndTime');
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/timerStatus', 'running');
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/submittedWords', {});
      expect(updateCall).toHaveProperty('rooms/test-room/gameData/grid');
    });

    it('should not start next round if at max rounds', async () => {
      const roomId = 'test-room';
      const room = createMockRoomInFinalRound();
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);
      mockUpdate.mockResolvedValue(undefined);

      await startNextRound(roomId);

      // Should not update anything
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should throw error if room not found', async () => {
      const roomId = 'non-existent-room';
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(startNextRound(roomId)).rejects.toThrow('Room not found');
    });

    it('should throw error if room not in playing state', async () => {
      const roomId = 'test-room';
      const room = createMockRoom();
      room.status = 'waiting';
      
      mockRef.mockReturnValue({} as any);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => room,
      } as any);

      await expect(startNextRound(roomId)).rejects.toThrow('Room is not in playing state');
    });
  });

  describe('calculateRoundResults', () => {
    it('should calculate round results correctly', () => {
      const room = createMockRoomWithSubmittedWords();
      const result = calculateRoundResults(room, 1);

      expect(result.roundNumber).toBe(1);
      expect(result.roundScores).toEqual({
        'host-123': 6, // CAT (3) + DOG (3)
        'player-456': 3, // BAT (3)
      });
      expect(result.roundWinner).toEqual({
        playerId: 'host-123',
        playerName: 'Host Player',
        score: 6,
      });
    });

    it('should handle room with no submitted words', () => {
      const room = createMockRoom();
      const result = calculateRoundResults(room, 1);

      expect(result.roundNumber).toBe(1);
      expect(result.roundScores).toEqual({
        'host-123': 0,
        'player-456': 0,
      });
      expect(result.roundWords).toEqual({
        'host-123': [],
        'player-456': [],
      });
      expect(result.roundWinner).toBeNull();
    });

    it('should handle tie scores correctly', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          submittedWords: {
            'host-123-cat': { word: 'CAT', playerId: 'host-123', playerName: 'Host Player', score: 3, submittedAt: Date.now() },
            'player-456-dog': { word: 'DOG', playerId: 'player-456', playerName: 'Test Player', score: 3, submittedAt: Date.now() },
          },
        },
      });

      const result = calculateRoundResults(room, 1);

      expect(result.roundScores).toEqual({
        'host-123': 3,
        'player-456': 3,
      });
      // In case of tie, it should be a draw
      expect(result.roundWinner).toBeNull();
    });

    it('should handle no scores correctly', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!
        },
      });

      const result = calculateRoundResults(room, 1);

      expect(result.roundScores).toEqual({
        'host-123': 0,
        'player-456': 0,
      });
      // In case of no scores, it should be a draw
      expect(result.roundWinner).toBeNull();
    });
  });

  describe('shouldRoundEnd', () => {
    it('should return true when timer has expired', () => {
      const room = createMockRoomWithExpiredTimer();
      expect(shouldRoundEnd(room)).toBe(true);
    });

    it('should return false when timer is still running', () => {
      const room = createMockRoom();
      expect(shouldRoundEnd(room)).toBe(false);
    });


    it('should return false when timer is already ended', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          timerStatus: 'ended',
        },
      });
      expect(shouldRoundEnd(room)).toBe(false);
    });

    it('should return false when no round end time is set', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          roundEndTime: undefined,
        },
      });
      expect(shouldRoundEnd(room)).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return correct remaining time', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          roundEndTime: Date.now() + 30000, // 30 seconds from now
        },
      });

      const remaining = getRemainingTime(room);
      expect(remaining).toBe(30);
    });

    it('should return 0 when timer has expired', () => {
      const room = createMockRoomWithExpiredTimer();
      const remaining = getRemainingTime(room);
      expect(remaining).toBe(0);
    });

    it('should return 0 when timer is ended', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          timerStatus: 'ended',
        },
      });

      const remaining = getRemainingTime(room);
      expect(remaining).toBe(0);
    });

    it('should handle timer advancing during test', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          roundEndTime: Date.now() + 10000, // 10 seconds from now
        },
      });

      let remaining = getRemainingTime(room);
      expect(remaining).toBe(10);

      // Advance time by 3 seconds
      jest.advanceTimersByTime(3000);
      remaining = getRemainingTime(room);
      expect(remaining).toBe(7);

      // Advance time by 8 more seconds (total 11)
      jest.advanceTimersByTime(8000);
      remaining = getRemainingTime(room);
      expect(remaining).toBe(0);
    });
  });

  describe('determineGameWinner', () => {
    it('returns null when no players', () => {
      const players = {};
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('returns null when all players have zero score', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 0,
          wordsFound: 0,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 0,
          wordsFound: 0,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('returns winner when one player has highest score', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 50,
          wordsFound: 3,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 25,
          wordsFound: 2,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player1',
        playerName: 'Player 1',
        finalScore: 100,
      });
    });

    it('returns null when two players tie for first place', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 50,
          wordsFound: 3,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('returns null when three players tie for first place', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('returns winner when one player has positive score and others have zero', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 0,
          wordsFound: 0,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 75,
          wordsFound: 3,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 0,
          wordsFound: 0,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player2',
        playerName: 'Player 2',
        finalScore: 75,
      });
    });

    it('handles single player correctly', () => {
      const players = {
        'player1': {
          displayName: 'Solo Player',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 150,
          wordsFound: 8,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player1',
        playerName: 'Solo Player',
        finalScore: 150,
      });
    });

    it('handles single player with zero score', () => {
      const players = {
        'player1': {
          displayName: 'Solo Player',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 0,
          wordsFound: 0,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('sorts players correctly by score (highest first)', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 25,
          wordsFound: 2,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 50,
          wordsFound: 3,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player2',
        playerName: 'Player 2',
        finalScore: 100,
      });
    });

    it('handles negative scores correctly', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: -10,
          wordsFound: 0,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 50,
          wordsFound: 3,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: -5,
          wordsFound: 0,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player2',
        playerName: 'Player 2',
        finalScore: 50,
      });
    });

    it('returns null when all players have negative scores', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: -10,
          wordsFound: 0,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: -5,
          wordsFound: 0,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });

    it('handles large number of players correctly', () => {
      const players: Record<string, any> = {};
      
      // Create 10 players with varying scores
      for (let i = 1; i <= 10; i++) {
        players[`player${i}`] = {
          displayName: `Player ${i}`,
          joinedAt: Date.now(),
          isHost: i === 1,
          isReady: true,
          score: i * 10, // Scores: 10, 20, 30, ..., 100
          wordsFound: i,
        };
      }
      
      const winner = determineGameWinner(players);
      expect(winner).toEqual({
        playerId: 'player10',
        playerName: 'Player 10',
        finalScore: 100,
      });
    });

    it('handles tie between multiple players with same high score', () => {
      const players = {
        'player1': {
          displayName: 'Player 1',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player2': {
          displayName: 'Player 2',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player3': {
          displayName: 'Player 3',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        'player4': {
          displayName: 'Player 4',
          joinedAt: Date.now(),
          isHost: false,
          isReady: true,
          score: 50,
          wordsFound: 3,
        },
      };
      const winner = determineGameWinner(players);
      expect(winner).toBeNull();
    });
  });
});
