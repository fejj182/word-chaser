import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoomProvider, useRoom } from '../RoomContext';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom, resolveRoomId, updatePlayerReady, startGame } from '@/lib/firebase/room-utils';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { Room } from '@/features/room-management/types/room';
import { User } from 'firebase/auth';

// Mock Firebase utilities
jest.mock('@/lib/firebase/room-utils', () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  subscribeToRoom: jest.fn(),
  updatePlayerReady: jest.fn(),
  startGame: jest.fn(),
  resolveRoomId: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/features/guest-auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/firebase/firebase-utils', () => ({
  ensureAnonymousWithAlias: jest.fn(),
}));

const mockCreateRoom = createRoom as jest.MockedFunction<typeof createRoom>;
const mockJoinRoom = joinRoom as jest.MockedFunction<typeof joinRoom>;
const mockLeaveRoom = leaveRoom as jest.MockedFunction<typeof leaveRoom>;
const mockSubscribeToRoom = subscribeToRoom as jest.MockedFunction<typeof subscribeToRoom>;
const mockResolveRoomId = resolveRoomId as jest.MockedFunction<typeof resolveRoomId>;
const mockUpdatePlayerReady = updatePlayerReady as jest.MockedFunction<typeof updatePlayerReady>;
const mockStartGame = startGame as jest.MockedFunction<typeof startGame>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockEnsureAnon = ensureAnonymousWithAlias as jest.MockedFunction<typeof ensureAnonymousWithAlias>;

// Test component to access room context
const TestComponent = () => {
  const { currentRoom, isLoading, error, createRoom, joinRoom, leaveRoom, updatePlayerReady, startGame, clearError } = useRoom();
  
  const handleCreateRoom = async () => {
    try {
      await createRoom({ maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } }, 'Test User');
    } catch {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };
  
  const handleJoinRoom = async () => {
    try {
      await joinRoom('test-room-id', 'Test User');
    } catch {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };
  
  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };

  const handleUpdatePlayerReady = async () => {
    try {
      await updatePlayerReady(true);
    } catch {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };
  
  return (
    <div>
      <div data-testid="current-room">{currentRoom ? JSON.stringify(currentRoom) : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleJoinRoom}>Join Room</button>
      <button onClick={handleLeaveRoom}>Leave Room</button>
      <button onClick={handleUpdatePlayerReady}>Update Ready</button>
      <button onClick={handleStartGame}>Start Game</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <UserProvider>
      <RoomProvider>
        {component}
      </RoomProvider>
    </UserProvider>
  );
};

describe('RoomContext', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
  };

  const mockRoom = {
    id: 'room123',
    name: 'Test Room',
    slug: 'test-room',
    createdBy: 'user123',
    createdAt: Date.now(),
    status: 'waiting' as const,
    players: [
      { id: 'user123', displayName: 'Test User', joinedAt: Date.now(), isHost: true, isReady: true }
    ],
    maxPlayers: 4,
    settings: { roundDuration: 60, maxRounds: 5 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockSubscribeToRoom.mockReturnValue(() => {});
    mockEnsureAnon.mockResolvedValue(mockUser as User);
    mockResolveRoomId.mockResolvedValue('test-room-id');
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('current-room')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Create Room', () => {
    it('should create a room successfully', async () => {
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledWith(
          { maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } },
          'user123',
          'Test User'
        );
      });
    });

    it('should handle create room errors', async () => {
      mockCreateRoom.mockRejectedValue(new Error('Failed to create room'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to create room');
      });
    });

    it('should show loading state during room creation', async () => {
      mockCreateRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('Join Room', () => {
    it('should join a room successfully', async () => {
      mockJoinRoom.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Room'));
      
      await waitFor(() => {
        expect(mockJoinRoom).toHaveBeenCalledWith('test-room-id', 'user123', 'Test User');
      });
    });

    it('should handle join room errors', async () => {
      mockJoinRoom.mockRejectedValue(new Error('Room not found'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Room'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Room not found');
      });
    });
  });

  describe('Leave Room', () => {
    it('should leave room when user is in a room', async () => {
      mockLeaveRoom.mockResolvedValue(undefined);
      
      // Mock subscription to simulate being in a room
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        callback(mockRoom);
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // First create a room to set the room ID and trigger subscription
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
      // Wait for room to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Leave Room'));
      
      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalledWith('room123', 'user123');
      });
    });

    it('should not attempt to leave room when not in a room', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Leave Room'));
      
      // Should not call leaveRoom when currentRoom is null
      expect(mockLeaveRoom).not.toHaveBeenCalled();
    });
  });

  describe('Update Player Ready', () => {
    it('should update player ready status when in a room', async () => {
      mockUpdatePlayerReady.mockResolvedValue(undefined);
      
      // Mock subscription to simulate being in a room
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        callback(mockRoom);
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // First create a room to set the room ID and trigger subscription
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
      // Wait for room to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Update Ready'));
      
      await waitFor(() => {
        expect(mockUpdatePlayerReady).toHaveBeenCalledWith('room123', 'user123', true);
      });
    });

    it('should require room and user to update ready status', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Update Ready'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No room or user');
      });
    });
  });

  describe('Start Game', () => {
    it('should start game when in a room', async () => {
      mockStartGame.mockResolvedValue(undefined);
      
      // Mock subscription to simulate being in a room
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        callback(mockRoom);
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // First create a room to set the room ID and trigger subscription
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
      // Wait for room to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Start Game'));
      
      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledWith('room123');
      });
    });

    it('should require room to start game', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Start Game'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No room');
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to room updates when room ID is set', async () => {
      renderWithProvider(<TestComponent />);
      
      // Simulate room creation which sets room ID
      mockCreateRoom.mockResolvedValue('room123');
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalledWith('room123', expect.any(Function));
      });
    });

    it('should update room state when subscription receives data', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // Simulate room creation
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback with room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
    });

    it('should handle room deletion via subscription', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // Simulate room creation
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Simulate room deletion
      act(() => {
        subscriptionCallback!(null);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('null');
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when clearError is called', async () => {
      mockJoinRoom.mockRejectedValue(new Error('Test error'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Room'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });
      
      fireEvent.click(screen.getByText('Clear Error'));
      
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during operations', async () => {
      mockCreateRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('Cleanup Logic', () => {
    it('should clean up subscription on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockSubscribeToRoom.mockReturnValue(mockUnsubscribe);
      
      mockCreateRoom.mockResolvedValue('room123');
      
      const { unmount } = renderWithProvider(<TestComponent />);
      
      // Create a room to set up subscription
      fireEvent.click(screen.getByText('Create Room'));
      
      // Wait for subscription to be set up
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Unmount the component
      unmount();
      
      // Should call the unsubscribe function
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
