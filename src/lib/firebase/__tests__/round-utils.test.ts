import {
  startRoundTimer,
  endCurrentRound,
  startNextRound,
  calculateRoundResults,
  shouldRoundEnd,
  getRemainingTime,
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
});
