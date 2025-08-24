import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoomProvider, useRoom } from '../RoomContext';
import { createRoom, joinRoom, leaveRoom, subscribeToRoom } from '@/lib/firebase/room-utils';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';

// Mock Firebase utilities
jest.mock('@/lib/firebase/room-utils', () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  subscribeToRoom: jest.fn(),
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
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockEnsureAnon = ensureAnonymousWithAlias as jest.MockedFunction<typeof ensureAnonymousWithAlias>;

// Test component to access room context
const TestComponent = () => {
  const { currentRoom, isLoading, error, createRoom, joinRoom, leaveRoom, clearError } = useRoom();
  
  const handleCreateRoom = async () => {
    try {
      await createRoom({ name: 'Test Room', maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } }, 'Test User');
    } catch (error) {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };
  
  const handleJoinRoom = async () => {
    try {
      await joinRoom('test-room-id', 'Test User');
    } catch (error) {
      // Error is handled by the context, we just need to catch it here to prevent test failures
    }
  };
  
  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch (error) {
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
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <RoomProvider>
      {component}
    </RoomProvider>
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
    mockEnsureAnon.mockResolvedValue(mockUser as any);
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
          { name: 'Test Room', maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } },
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
      let subscriptionCallback: (room: any) => void;
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
      let subscriptionCallback: (room: any) => void;
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

    it('should create room even when unauthenticated by ensuring alias sign-in', async () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      mockCreateRoom.mockResolvedValue('room123');

      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText('Create Room'));

      await waitFor(() => {
        expect(mockEnsureAnon).toHaveBeenCalledWith('Test User');
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });

    it('should handle empty room ID from Firebase', async () => {
      mockCreateRoom.mockResolvedValue('');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid room ID received from server');
      });
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
    beforeEach(() => {
      // Mock navigator.sendBeacon
      Object.defineProperty(navigator, 'sendBeacon', {
        value: jest.fn(),
        writable: true,
      });
      
      // Mock document.visibilityState
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should set up cleanup event listeners when user is in a room', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Trigger room creation to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Room'));
      });
      
      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        expect(documentAddEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      });
    });

    it('should not set up cleanup listeners when user is not in a room', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      // Don't create a room, so no cleanup listeners should be set up
      // The cleanup effect should not run because currentRoom is null
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should send cleanup request on beforeunload', async () => {
      const sendBeaconSpy = jest.spyOn(navigator, 'sendBeacon');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create a room to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Room'));
      });
      
      // Wait for the room to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toContainHTML('room123');
      });
      
      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/leave-room',
        JSON.stringify({
          roomId: 'room123',
          userId: 'user123'
        })
      );
    });

    it('should handle visibility change events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('room123');
      
      renderWithProvider(<TestComponent />);
      
      // Create a room to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Room'));
      });
      
      // Wait for the room to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toContainHTML('room123');
      });
      
      // Simulate page becoming hidden
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
      const visibilityChangeEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityChangeEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith('Page hidden - user may have navigated away');
      
      consoleSpy.mockRestore();
    });

    it('should clean up event listeners on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('room123');
      
      const { unmount } = renderWithProvider(<TestComponent />);
      
      // Create a room to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Room'));
      });
      
      // Wait for the room to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-room')).toContainHTML('room123');
      });
      
      // Unmount the component
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });
});
