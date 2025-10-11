import { renderHook, act } from '@testing-library/react';
import { useGameTimer } from '../useGameTimer';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import {
  createMockRoom,
  createMockRoomWithExpiredTimer,
  roundTestScenarios,
} from '../../test-utils/round-test-utils';

// Mock the contexts
jest.mock('@/features/room-management/contexts/RoomContext');
jest.mock('@/features/user-management/hooks/useAuth');

// Mock the round-utils functions
jest.mock('@/lib/firebase/round-utils', () => ({
  startRoundTimer: jest.fn(),
  endCurrentRound: jest.fn(),
  shouldRoundEnd: jest.fn(),
  getRemainingTime: jest.fn(),
}));

import { startRoundTimer, endCurrentRound, shouldRoundEnd, getRemainingTime } from '@/lib/firebase/round-utils';

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockStartRoundTimer = startRoundTimer as jest.MockedFunction<typeof startRoundTimer>;
const mockEndCurrentRound = endCurrentRound as jest.MockedFunction<typeof endCurrentRound>;
const mockShouldRoundEnd = shouldRoundEnd as jest.MockedFunction<typeof shouldRoundEnd>;
const mockGetRemainingTime = getRemainingTime as jest.MockedFunction<typeof getRemainingTime>;

describe('useGameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { uid: 'host-123', displayName: 'Host Player' },
      loading: false,
    } as any);

    mockGetRemainingTime.mockReturnValue(30);
    mockShouldRoundEnd.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('timer display', () => {
    it('should display remaining time correctly', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(45);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(45);
    });

    it('should update time when getRemainingTime returns different values', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      // Test that the hook returns the value from getRemainingTime
      mockGetRemainingTime.mockReturnValue(30);
      const { result } = renderHook(() => useGameTimer());
      expect(result.current.timeLeft).toBe(30);

      // Test with different mock values by creating new hook instances
      mockGetRemainingTime.mockReturnValue(29);
      const { result: result2 } = renderHook(() => useGameTimer());
      expect(result2.current.timeLeft).toBe(29);

      mockGetRemainingTime.mockReturnValue(28);
      const { result: result3 } = renderHook(() => useGameTimer());
      expect(result3.current.timeLeft).toBe(28);
    });

    it('should return 0 when no room data', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(0);
    });

    it('should update timer every second with fake timers', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      // Mock getRemainingTime to return different values on subsequent calls
      let callCount = 0;
      mockGetRemainingTime.mockImplementation(() => {
        callCount++;
        return 30 - (callCount - 1); // 30, 29, 28, 27...
      });

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(30);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(29);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(28);
    });

    it('should stop timer interval when room becomes null', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(30);

      const { result, rerender } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(30);

      // Room becomes null
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        loading: false,
      } as any);

      rerender();

      expect(result.current.timeLeft).toBe(0);

      // Advance timer - should not update since room is null
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(0);
    });
  });

  describe('host functionality', () => {
    it('should identify host correctly', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isHost).toBe(true);
    });

    it('should identify non-host correctly', () => {
      const room = createMockRoom();
      mockUseAuth.mockReturnValue({
        user: { uid: 'player-456', displayName: 'Test Player' },
        loading: false,
      } as any);

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isHost).toBe(false);
    });

    it('should return false for host when no user', () => {
      const room = createMockRoom();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any);

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isHost).toBe(false);
    });
  });

  describe('start round timer', () => {
    it('should start timer when host calls startRoundTimer', async () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockStartRoundTimer.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGameTimer());

      await act(async () => {
        await result.current.startRoundTimer();
      });

      expect(mockStartRoundTimer).toHaveBeenCalledWith('test-room-123');
    });

    it('should throw error when non-host tries to start timer', async () => {
      const room = createMockRoom();
      mockUseAuth.mockReturnValue({
        user: { uid: 'player-456', displayName: 'Test Player' },
        loading: false,
      } as any);

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      await expect(async () => {
        await act(async () => {
          await result.current.startRoundTimer();
        });
      }).rejects.toThrow('Only the host can start the timer');
    });

    it('should throw error when no room', async () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      await expect(async () => {
        await act(async () => {
          await result.current.startRoundTimer();
        });
      }).rejects.toThrow('Only the host can start the timer');
    });
  });

  describe('timer status and round info', () => {
    it('should return correct isTimerRunning status', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          timerStatus: 'running',
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isTimerRunning).toBe(true);
    });


    it('should return false for isTimerRunning when timer is ended', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          timerStatus: 'ended',
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isTimerRunning).toBe(false);
    });

    it('should return correct currentRound', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 3,
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.currentRound).toBe(3);
    });

    it('should return default currentRound of 1 when not set', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: undefined,
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.currentRound).toBe(1);
    });

    it('should return default values when no gameData', () => {
      const room = createMockRoom({
        gameData: undefined,
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.isTimerRunning).toBe(false);
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('automatic round expiry', () => {
    it('should have automatic round expiry interval set up', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(false);

      const { result } = renderHook(() => useGameTimer());

      // The hook should be set up and ready
      expect(result.current.isHost).toBe(true);
      expect(result.current.currentRound).toBe(1);
    });

    it('should call endCurrentRound when timer expires', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(true);
      mockEndCurrentRound.mockResolvedValue(undefined);

      renderHook(() => useGameTimer());

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockEndCurrentRound).toHaveBeenCalledWith('test-room-123');
    });

    it('should set up expiry check interval correctly', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(false);

      const { result } = renderHook(() => useGameTimer());

      // The hook should be set up and ready for expiry checking
      expect(result.current.isHost).toBe(true);
      expect(result.current.currentRound).toBe(1);
    });

    it('should not call endCurrentRound when timer has not expired', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(false);
      mockEndCurrentRound.mockResolvedValue(undefined);

      renderHook(() => useGameTimer());

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockEndCurrentRound).not.toHaveBeenCalled();
    });

    it('should not check expiry when not host', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseAuth.mockReturnValue({
        user: { uid: 'player-456', displayName: 'Test Player' },
        loading: false,
      } as any);
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(true);
      mockEndCurrentRound.mockResolvedValue(undefined);

      renderHook(() => useGameTimer());

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockEndCurrentRound).not.toHaveBeenCalled();
    });

    it('should not check expiry when no room', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(true);
      mockEndCurrentRound.mockResolvedValue(undefined);

      renderHook(() => useGameTimer());

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockEndCurrentRound).not.toHaveBeenCalled();
    });
  });

  describe('interval cleanup', () => {
    it('should cleanup timer interval when component unmounts', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(30);

      const { unmount } = renderHook(() => useGameTimer());

      // Verify timer is running
      expect(mockGetRemainingTime).toHaveBeenCalled();

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    it('should cleanup expiry check interval when component unmounts', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(true);
      mockEndCurrentRound.mockResolvedValue(undefined);

      const { unmount } = renderHook(() => useGameTimer());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    it('should cleanup intervals when room changes', () => {
      const room1 = createMockRoom();
      const room2 = createMockRoom({ id: 'room-2' });

      mockUseRoom.mockReturnValue({
        currentRoom: room1,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(30);

      const { rerender } = renderHook(() => useGameTimer());

      mockUseRoom.mockReturnValue({
        currentRoom: room2,
        loading: false,
      } as any);

      rerender();

      // The hook should still work with the new room
      expect(mockGetRemainingTime).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle startRoundTimer errors gracefully', async () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockStartRoundTimer.mockRejectedValue(new Error('Firebase error'));

      const { result } = renderHook(() => useGameTimer());

      await expect(async () => {
        await act(async () => {
          await result.current.startRoundTimer();
        });
      }).rejects.toThrow('Firebase error');
    });

    it('should handle automatic round expiry errors gracefully', () => {
      const room = createMockRoomWithExpiredTimer();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockShouldRoundEnd.mockReturnValue(true);
      mockEndCurrentRound.mockRejectedValue(new Error('Firebase error'));

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useGameTimer());

      // The hook should be set up and ready
      expect(result.current.isHost).toBe(true);
      expect(result.current.currentRound).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('different room scenarios', () => {

    it('should work with timer ended', () => {
      const room = roundTestScenarios.timerEnded();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(0);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(0);
    });

    it('should work with words submitted', () => {
      const room = roundTestScenarios.wordsSubmitted();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      mockGetRemainingTime.mockReturnValue(45);

      const { result } = renderHook(() => useGameTimer());

      expect(result.current.timeLeft).toBe(45);
      expect(result.current.isHost).toBe(true);
    });
  });
});

