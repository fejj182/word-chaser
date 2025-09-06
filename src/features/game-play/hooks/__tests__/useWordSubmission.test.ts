import { renderHook, act } from '@testing-library/react';
import { useWordSubmission } from '../useWordSubmission';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

// Mock the hooks
jest.mock('@/features/user-management/hooks/useAuth');
jest.mock('@/features/room-management/contexts/RoomContext');

// Mock fetch
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useWordSubmission', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'TestUser'
  };

  const mockRoom = {
    id: 'room123',
    name: 'Test Room',
    status: 'playing'
  };

  const mockBoardLetters = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H']
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser
    } as ReturnType<typeof useAuth>);

    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom
    } as ReturnType<typeof useRoom>);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWordSubmission());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('submits word successfully', async () => {
    const mockResponse = {
      success: true,
      result: {
        isValid: true,
        score: 30
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useWordSubmission());

    await act(async () => {
      const response = await result.current.submitWord('cat', mockBoardLetters);
      expect(response).toEqual(mockResponse);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/validate-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: 'cat',
        boardLetters: mockBoardLetters
      })
    });
  });

  it('handles fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useWordSubmission());

    await act(async () => {
      try {
        await result.current.submitWord('cat', mockBoardLetters);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('handles HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response);

    const { result } = renderHook(() => useWordSubmission());

    await act(async () => {
      try {
        await result.current.submitWord('cat', mockBoardLetters);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('HTTP error! status: 500');
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useWordSubmission());

    // Set an error first
    act(() => {
      result.current.error = 'Test error';
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('trims word before submission', async () => {
    const mockResponse = {
      success: true,
      result: { isValid: true, score: 30 }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useWordSubmission());

    await act(async () => {
      await result.current.submitWord('  cat  ', mockBoardLetters);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/validate-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: 'cat', // Should be trimmed
        boardLetters: mockBoardLetters
      })
    });
  });
});
