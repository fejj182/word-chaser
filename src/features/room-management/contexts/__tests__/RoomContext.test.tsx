import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoomProvider, useRoom } from '../RoomContext';
import { UserProvider } from '@/features/user-management/contexts/UserContext';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom, resolveRoomId, updatePlayerReady, startGame } from '@/lib/firebase/room-utils';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { Room } from '@/features/room-management/types/room';
import { User } from 'firebase/auth';
import { GridSize } from '@/features/game-play/contexts/GamePlayContext';

// Mock Firebase utilities
jest.mock('@/lib/firebase/room-utils', () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  loadRoom: jest.fn(),
  leaveRoom: jest.fn(),
  subscribeToRoom: jest.fn(),
  updatePlayerReady: jest.fn(),
  startGame: jest.fn(),
  resolveRoomId: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/features/user-management/hooks/useAuth', () => ({
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
  const { currentRoom, isLoading, error, createRoom, joinRoom, leaveRoom, updatePlayerReady, startGame, loadRoom,clearError } = useRoom();
  
  const handleCreateRoom = async () => {
    try {
      await createRoom({ maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" } }, 'Test User');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleLoadRoom = async () => {
    try {
      await loadRoom('test-room-id');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleJoinRoom = async () => {
    try {
      await joinRoom('test-room-id', 'Test User');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch {
      // Error is handled by the context
    }
  };

  const handleUpdatePlayerReady = async () => {
    try {
      await updatePlayerReady(true);
    } catch {
      // Error is handled by the context
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch {
      // Error is handled by the context
    }
  };
  
  return (
    <div>
      <div data-testid="current-room">{currentRoom ? JSON.stringify(currentRoom) : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleLoadRoom}>Load Room</button>
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
    players: {
      'user123': { displayName: 'Test User', joinedAt: Date.now(), isHost: true, isReady: true }
    },
    maxPlayers: 4,
    settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" as GridSize },
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
          { maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5, gridSize: "small"} },
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

  describe('Load Room', () => {
    it('should load a room successfully', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Room'));
      
      await waitFor(() => {
        expect(mockResolveRoomId).toHaveBeenCalledWith('test-room-id');
      });
    });

    it('should handle load room errors', async () => {
      mockResolveRoomId.mockRejectedValue(new Error('Room not found'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Room'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Room not found');
      });
    });

    it('should show loading state during room loading', async () => {
      mockResolveRoomId.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Room'));
      
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
      // Mock subscription to simulate being in a room
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        callback(mockRoom);
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // First create a room to set the room ID and trigger subscription
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Room'));
      
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
      
      expect(mockLeaveRoom).not.toHaveBeenCalled();
    });
  });

  describe('Update Player Ready', () => {
    it('should update player ready status when in a room', async () => {  
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

  describe('Subscription Management', () => {
    it('should automatically subscribe when roomId changes', async () => {
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Initially no subscription
      expect(mockSubscribeToRoom).not.toHaveBeenCalled();
      
      // Create room to set roomId
      fireEvent.click(screen.getByText('Create Room'));
      
      // Should automatically subscribe when roomId is set
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalledWith('room123', expect.any(Function));
      });
    });

    it('should handle subscription callback with room data', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to trigger subscription
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback with room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      // Should update currentRoom state
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
    });

    it('should handle subscription callback with null (room deleted)', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to trigger subscription
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // First set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Simulate room deletion via subscription
      act(() => {
        subscriptionCallback!(null);
      });
      
      // Should clear currentRoom state
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('null');
      });
    });

    it('should not subscribe when roomId is null', () => {
      renderWithProvider(<TestComponent />);
      
      // Should not call subscribeToRoom when roomId is null
      expect(mockSubscribeToRoom).not.toHaveBeenCalled();
    });
  });

  describe('Page Unload Cleanup', () => {
    let mockWindowAddEventListener: jest.SpyInstance;
    let mockWindowRemoveEventListener: jest.SpyInstance;
    let mockDocumentAddEventListener: jest.SpyInstance;
    let mockDocumentRemoveEventListener: jest.SpyInstance;
    let mockSendBeacon: jest.MockedFunction<typeof navigator.sendBeacon>;
    
    beforeEach(() => {
      mockWindowAddEventListener = jest.spyOn(window, 'addEventListener');
      mockWindowRemoveEventListener = jest.spyOn(window, 'removeEventListener');
      mockDocumentAddEventListener = jest.spyOn(document, 'addEventListener');
      mockDocumentRemoveEventListener = jest.spyOn(document, 'removeEventListener');
      
      // Mock navigator.sendBeacon since it doesn't exist in Jest environment
      Object.defineProperty(navigator, 'sendBeacon', {
        value: jest.fn().mockImplementation(() => true),
        writable: true,
        configurable: true,
      });
      mockSendBeacon = navigator.sendBeacon as jest.MockedFunction<typeof navigator.sendBeacon>;
    });
    
    afterEach(() => {
      mockWindowAddEventListener.mockRestore();
      mockWindowRemoveEventListener.mockRestore();
      mockDocumentAddEventListener.mockRestore();
      mockDocumentRemoveEventListener.mockRestore();
      delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    });

    it('should set up beforeunload and visibilitychange listeners when in a room', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to be in a room
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback to set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Wait for event listeners to be set up
      await waitFor(() => {
        const windowAddEventListenerCalls = mockWindowAddEventListener.mock.calls;
        const documentAddEventListenerCalls = mockDocumentAddEventListener.mock.calls;
        const allEventTypes = [
          ...windowAddEventListenerCalls.map((call: unknown[]) => call[0]),
          ...documentAddEventListenerCalls.map((call: unknown[]) => call[0])
        ];
        expect(allEventTypes).toContain('beforeunload');
        expect(allEventTypes).toContain('visibilitychange');
      });
    });

    it('should not set up listeners when not in a room', () => {
      renderWithProvider(<TestComponent />);
      
      // Should not set up event listeners when not in a room
      expect(mockWindowAddEventListener).not.toHaveBeenCalled();
      expect(mockDocumentAddEventListener).not.toHaveBeenCalled();
    });

    it('should not set up listeners when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      // Should not set up event listeners when user is null
      expect(mockWindowAddEventListener).not.toHaveBeenCalled();
      expect(mockDocumentAddEventListener).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', async () => {
      let subscriptionCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      const { unmount } = renderWithProvider(<TestComponent />);
      
      // Create room to set up listeners
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback to set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Unmount component
      unmount();
      
      // Wait for event listeners to be set up before unmounting
      await waitFor(() => {
        const windowAddEventListenerCalls = mockWindowAddEventListener.mock.calls;
        const documentAddEventListenerCalls = mockDocumentAddEventListener.mock.calls;
        const allEventTypes = [
          ...windowAddEventListenerCalls.map((call: unknown[]) => call[0]),
          ...documentAddEventListenerCalls.map((call: unknown[]) => call[0])
        ];
        expect(allEventTypes).toContain('beforeunload');
        expect(allEventTypes).toContain('visibilitychange');
      });
      
      // Unmount component
      unmount();
      
      // Should remove event listeners
      await waitFor(() => {
        const windowRemoveEventListenerCalls = mockWindowRemoveEventListener.mock.calls;
        const documentRemoveEventListenerCalls = mockDocumentRemoveEventListener.mock.calls;
        const allEventTypes = [
          ...windowRemoveEventListenerCalls.map((call: unknown[]) => call[0]),
          ...documentRemoveEventListenerCalls.map((call: unknown[]) => call[0])
        ];
        expect(allEventTypes).toContain('beforeunload');
        expect(allEventTypes).toContain('visibilitychange');
      });
    });

    it('should handle beforeunload event by sending cleanup request', async () => {
      let beforeUnloadHandler: (event: Event) => void;
      let subscriptionCallback: (room: Room | null) => void;
      
      mockWindowAddEventListener.mockImplementation((event: string, handler: EventListener) => {
        if (event === 'beforeunload') {
          beforeUnloadHandler = handler;
        }
      });
      
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to set up listeners
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback to set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Simulate beforeunload event
      const mockEvent = new Event('beforeunload');
      beforeUnloadHandler!(mockEvent);
      
      // Should send cleanup request via sendBeacon
      expect(mockSendBeacon).toHaveBeenCalledWith('/api/leave-room', expect.any(String));
      
      // Verify the data sent
      const sentData = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(sentData).toEqual({
        roomId: 'room123',
        userId: 'user123'
      });
    });

    it('should handle visibilitychange event when page becomes hidden', async () => {
      let visibilityChangeHandler: (event: Event) => void;
      let subscriptionCallback: (room: Room | null) => void;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Capture the visibilitychange handler
      mockDocumentAddEventListener.mockImplementation((event: string, handler: EventListener) => {
        if (event === 'visibilitychange') {
          visibilityChangeHandler = handler;
        }
      });
      
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to set up listeners
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback to set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Wait for event listeners to be set up
      await waitFor(() => {
        expect(mockDocumentAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      });
      
      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      });
      
      const mockEvent = new Event('visibilitychange');
      visibilityChangeHandler!(mockEvent);
      
      // Should log when page becomes hidden
      expect(consoleSpy).toHaveBeenCalledWith('Page hidden - user may have navigated away');
      
      consoleSpy.mockRestore();
    });

    it('should handle sendBeacon failure gracefully', async () => {
      let beforeUnloadHandler: (event: Event) => void;
      let subscriptionCallback: (room: Room | null) => void;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockWindowAddEventListener.mockImplementation((event: string, handler: EventListener) => {
        if (event === 'beforeunload') {
          beforeUnloadHandler = handler;
        }
      });
      
      mockSubscribeToRoom.mockImplementation((roomId, callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      
      // Mock sendBeacon to fail
      mockSendBeacon.mockImplementation(() => {
        throw new Error('sendBeacon failed');
      });
      
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create room to set up listeners
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback to set room data
      act(() => {
        subscriptionCallback!(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toHaveTextContent('room123');
      });
      
      // Simulate beforeunload event
      const mockEvent = new Event('beforeunload');
      beforeUnloadHandler!(mockEvent);
      
      // Should log warning when sendBeacon fails
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send cleanup request:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
