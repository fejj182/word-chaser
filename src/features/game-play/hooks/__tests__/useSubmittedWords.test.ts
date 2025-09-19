import { renderHook } from '@testing-library/react';
import { useSubmittedWords } from '../useSubmittedWords';

// Mock the RoomContext
jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn()
}));

const mockUseRoom = jest.mocked(jest.requireMock('@/features/room-management/contexts/RoomContext').useRoom);

describe('useSubmittedWords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no submitted words exist', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room',
        gameData: {}
      }
    });

    const { result } = renderHook(() => useSubmittedWords());

    expect(result.current.submittedWords).toEqual([]);
    expect(result.current.isWordSubmitted('TEST')).toBe(false);
  });

  it('returns submitted words sorted by submission time', () => {
    const mockSubmittedWords = {
      'FIRST': {
        word: 'FIRST',
        playerId: 'player1',
        playerName: 'Player One',
        score: 10,
        submittedAt: 1000
      },
      'SECOND': {
        word: 'SECOND',
        playerId: 'player2',
        playerName: 'Player Two',
        score: 20,
        submittedAt: 2000
      }
    };

    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room',
        gameData: {
          submittedWords: mockSubmittedWords
        }
      }
    });

    const { result } = renderHook(() => useSubmittedWords());

    expect(result.current.submittedWords).toHaveLength(2);
    expect(result.current.submittedWords[0].word).toBe('SECOND'); // Newest first
    expect(result.current.submittedWords[1].word).toBe('FIRST');
  });

  it('correctly identifies submitted words', () => {
    const mockSubmittedWords = {
      'TEST': {
        word: 'TEST',
        playerId: 'player1',
        playerName: 'Player One',
        score: 10,
        submittedAt: 1000
      }
    };

    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room',
        gameData: {
          submittedWords: mockSubmittedWords
        }
      }
    });

    const { result } = renderHook(() => useSubmittedWords());

    expect(result.current.isWordSubmitted('TEST')).toBe(true);
    expect(result.current.isWordSubmitted('test')).toBe(true); // Case insensitive
    expect(result.current.isWordSubmitted('NEW')).toBe(false);
  });

  it('handles null currentRoom', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null
    });

    const { result } = renderHook(() => useSubmittedWords());

    expect(result.current.submittedWords).toEqual([]);
    expect(result.current.isWordSubmitted('TEST')).toBe(false);
  });
});
