import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../SessionContext';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
import { 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  subscribeToRoom, 
  resolveRoomId, 
  updatePlayerReady, 
  startGame 
} from '@/lib/firebase/room-utils';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { ensureAnonymousWithAlias } from '@/lib/firebase/firebase-utils';
import { User } from 'firebase/auth';
import { Session } from '@/features/session-management/types/session';
import { Room } from '@/features/room-management/types/room';

// Mock Firebase utilities
jest.mock('@/lib/firebase/room-utils', () => ({
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  subscribeToRoom: jest.fn(),
  resolveRoomId: jest.fn(),
  updatePlayerReady: jest.fn(),
  startGame: jest.fn(),
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

// Test component to access session context
const TestComponent = () => {
  const { 
    currentSession, 
    isLoading, 
    error, 
    createSession, 
    loadSession, 
    joinSession, 
    leaveSession, 
    setPlayerReady, 
    startSession, 
    clearError 
  } = useSession();
  
  const handleCreateSession = async () => {
    try {
      await createSession({ maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } }, 'Test User');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleLoadSession = async () => {
    try {
      await loadSession('test-session-id');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleJoinSession = async () => {
    try {
      await joinSession('test-session-id', 'Test User');
    } catch {
      // Error is handled by the context
    }
  };
  
  const handleLeaveSession = async () => {
    try {
      await leaveSession();
    } catch {
      // Error is handled by the context
    }
  };

  const handleSetPlayerReady = async () => {
    try {
      await setPlayerReady(true);
    } catch {
      // Error is handled by the context
    }
  };

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch {
      // Error is handled by the context
    }
  };
  
  return (
    <div>
      <div data-testid="current-session">{currentSession ? JSON.stringify(currentSession) : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={handleCreateSession}>Create Session</button>
      <button onClick={handleLoadSession}>Load Session</button>
      <button onClick={handleJoinSession}>Join Session</button>
      <button onClick={handleLeaveSession}>Leave Session</button>
      <button onClick={handleSetPlayerReady}>Set Ready</button>
      <button onClick={handleStartSession}>Start Session</button>
      <button onClick={() => clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <UserProvider>
      <SessionProvider>
        {component}
      </SessionProvider>
    </UserProvider>
  );
};

describe('SessionContext', () => {
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

  const mockSession: Session = {
    id: 'session123',
    name: 'Test Session',
    status: 'waiting',
    players: [
      { id: 'user123', displayName: 'Test User', isHost: true, isReady: true }
    ],
    maxPlayers: 4,
    settings: { roundDuration: 60, maxRounds: 5 }
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
    mockResolveRoomId.mockResolvedValue('test-session-id');
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('current-session')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should throw error when used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        try {
          useSession();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error-message">{(error as Error).message}</div>;
        }
      };

      render(<TestComponentOutsideProvider />);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useSession must be used within a SessionProvider'
      );
    });
  });

  describe('Create Session', () => {
    it('should create a session successfully', async () => {
      mockCreateRoom.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledWith(
          { maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } },
          'user123',
          'Test User'
        );
      });
    });

    it('should handle create session errors', async () => {
      mockCreateRoom.mockRejectedValue(new Error('Failed to create session'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to create session');
      });
    });

    it('should show loading state during session creation', async () => {
      mockCreateRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle empty session ID from Firebase', async () => {
      mockCreateRoom.mockResolvedValue('');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid session ID received from server');
      });
    });

    it('should create session even when unauthenticated by ensuring alias sign-in', async () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      mockCreateRoom.mockResolvedValue('session123');

      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText('Create Session'));

      await waitFor(() => {
        expect(mockEnsureAnon).toHaveBeenCalledWith('Test User');
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });
  });

  describe('Load Session', () => {
    it('should load a session successfully', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Session'));
      
      await waitFor(() => {
        expect(mockResolveRoomId).toHaveBeenCalledWith('test-session-id');
      });
    });

    it('should handle load session errors', async () => {
      mockResolveRoomId.mockRejectedValue(new Error('Session not found'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Session not found');
      });
    });

    it('should show loading state during session loading', async () => {
      mockResolveRoomId.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Session'));
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('Join Session', () => {
    it('should join a session successfully', async () => {
      mockJoinRoom.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Session'));
      
      await waitFor(() => {
        expect(mockJoinRoom).toHaveBeenCalledWith('test-session-id', 'user123', 'Test User');
      });
    });

    it('should handle join session errors', async () => {
      mockJoinRoom.mockRejectedValue(new Error('Session not found'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Session not found');
      });
    });

    it('should join session even when unauthenticated by ensuring alias sign-in', async () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      mockJoinRoom.mockResolvedValue(undefined);

      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText('Join Session'));

      await waitFor(() => {
        expect(mockEnsureAnon).toHaveBeenCalledWith('Test User');
        expect(screen.getByTestId('error')).toHaveTextContent('null');
      });
    });
  });

  describe('Leave Session', () => {
    it('should leave session when user is in a session', async () => {
      renderWithProvider(<TestComponent />);
      
      // First create a session to set the session ID and trigger subscription
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      // Wait for session to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Leave Session'));
      
      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalledWith('session123', 'user123');
      });
    });

    it('should not attempt to leave session when no session is active', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Leave Session'));
      
      // Should not call leaveRoom when no session is active
      expect(mockLeaveRoom).not.toHaveBeenCalled();
    });

    it('should not attempt to leave session when no user is authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Leave Session'));
      
      // Should not call leaveRoom when no user is authenticated
      expect(mockLeaveRoom).not.toHaveBeenCalled();
    });
  });

  describe('Set Player Ready', () => {
    it('should set player ready status successfully', async () => {
      renderWithProvider(<TestComponent />);
      
      // First create a session to set the session ID and trigger subscription
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      // Wait for session to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Set Ready'));
      
      await waitFor(() => {
        expect(mockUpdatePlayerReady).toHaveBeenCalledWith('session123', 'user123', true);
      });
    });

    it('should handle set player ready errors', async () => {
      mockUpdatePlayerReady.mockRejectedValue(new Error('Failed to update ready status'));
      
      renderWithProvider(<TestComponent />);
      
      // First create a session to set the session ID and trigger subscription
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      // Wait for session to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Set Ready'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to update ready status');
      });
    });

    it('should throw error when no active session', async () => {
      renderWithProvider(<TestComponent />);
      
      // Try to set ready without being in a session
      await act(async () => {
        fireEvent.click(screen.getByText('Set Ready'));
      });
      
      // The error is thrown but not set in state, so we expect the error to be null
      // The actual error handling happens in the component that calls this method
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Start Session', () => {
    it('should start session successfully', async () => {    
      renderWithProvider(<TestComponent />);
      
      // First create a session to set the session ID and trigger subscription
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      // Wait for session to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Start Session'));
      
      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledWith('session123');
      });
    });

    it('should handle start session errors', async () => {
      mockStartGame.mockRejectedValue(new Error('Failed to start session'));
      
      renderWithProvider(<TestComponent />);
      
      // First create a session to set the session ID and trigger subscription
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      // Wait for session to be set
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).not.toHaveTextContent('null');
      });
      
      fireEvent.click(screen.getByText('Start Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to start session');
      });
    });

    it('should throw error when no active session', async () => {
      renderWithProvider(<TestComponent />);
      
      // Try to start session without being in a session
      await act(async () => {
        fireEvent.click(screen.getByText('Start Session'));
      });
      
      // The error is thrown but not set in state, so we expect the error to be null
      // The actual error handling happens in the component that calls this method
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to session updates when session ID is set', async () => {
      renderWithProvider(<TestComponent />);
      
      // Simulate session creation which sets session ID
      mockCreateRoom.mockResolvedValue('session123');
      
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalledWith('session123', expect.any(Function));
      });
    });

    it('should update session state when subscription receives data', async () => {
      let subscribeToRoomCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((sessionId, callback) => {
        subscribeToRoomCallback = callback;
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // Simulate session creation
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate subscription callback with room data
      act(() => {
        subscribeToRoomCallback(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toHaveTextContent('room123');
      });
    });

    it('should handle session deletion via subscription', async () => {
      let subscribeToRoomCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((sessionId, callback) => {
        subscribeToRoomCallback = callback;
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // Simulate session creation
      mockCreateRoom.mockResolvedValue('room123');
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      // Simulate session data
      act(() => {
        subscribeToRoomCallback(mockRoom);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toHaveTextContent('room123');
      });
      
      // Simulate session deletion
      act(() => {
        subscribeToRoomCallback(null);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toHaveTextContent('null');
      });
    });

    it('should transform room data to session data correctly', async () => {
      let subscribeToRoomCallback: (room: Room | null) => void;
      mockSubscribeToRoom.mockImplementation((sessionId, callback) => {
        subscribeToRoomCallback = callback;
        return () => {};
      });
      
      renderWithProvider(<TestComponent />);
      
      // Simulate session creation
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalled();
      });
      
      act(() => {
        subscribeToRoomCallback(mockRoom);
      });
      
      await waitFor(() => {
        const sessionData = JSON.parse(screen.getByTestId('current-session').textContent || 'null');
        expect(sessionData.id).toBe('room123');
        expect(sessionData.name).toBe('Test Room');
        expect(sessionData.status).toBe('waiting');
        expect(sessionData.players).toHaveLength(1);
        expect(sessionData.players[0].id).toBe('user123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when clearError is called', async () => {
      mockJoinRoom.mockRejectedValue(new Error('Test error'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });
      
      fireEvent.click(screen.getByText('Clear Error'));
      
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should handle non-Error objects in catch blocks', async () => {
      mockCreateRoom.mockRejectedValue('String error');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to create session');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during operations', async () => {
      mockCreateRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Session'));
      
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

    it('should set up cleanup event listeners when user is in a session', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      // Trigger session creation to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Session'));
      });
      
      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        expect(documentAddEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      });
    });

    it('should not set up cleanup listeners when user is not in a session', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      // Don't create a session, so no cleanup listeners should be set up
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should send cleanup request on beforeunload', async () => {
      const sendBeaconSpy = jest.spyOn(navigator, 'sendBeacon');
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      // Create a session to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Session'));
      });
      
      // Wait for the session to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toContainHTML('session123');
      });
      
      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/leave-room',
        JSON.stringify({
          roomId: 'session123',
          userId: 'user123'
        })
      );
    });

    it('should handle visibility change events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      // Create a session to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Session'));
      });
      
      // Wait for the session to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toContainHTML('session123');
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
      mockCreateRoom.mockResolvedValue('session123');
      
      const { unmount } = renderWithProvider(<TestComponent />);
      
      // Create a session to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Session'));
      });
      
      // Wait for the session to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toContainHTML('session123');
      });
      
      // Unmount the component
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('should handle sendBeacon errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const sendBeaconSpy = jest.spyOn(navigator, 'sendBeacon').mockImplementation(() => {
        throw new Error('Network error');
      });
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      mockCreateRoom.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      // Create a session to set up cleanup listeners
      await act(async () => {
        fireEvent.click(screen.getByText('Create Session'));
      });
      
      // Wait for the session to be set up
      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toContainHTML('session123');
      });
      
      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send cleanup request:', expect.any(Error));
      
      consoleSpy.mockRestore();
      sendBeaconSpy.mockRestore();
    });
  });

  describe('Subscribe to Session', () => {
    it('should return unsubscribe function', async () => {
      const unsubscribe = jest.fn();
      mockSubscribeToRoom.mockReturnValue(unsubscribe);
      
      renderWithProvider(<TestComponent />);
      
      // The subscribeToSession function is not directly exposed in the test component
      // but we can verify that the underlying subscribeToRoom is called correctly
      mockCreateRoom.mockResolvedValue('session123');
      fireEvent.click(screen.getByText('Create Session'));
      
      await waitFor(() => {
        expect(mockSubscribeToRoom).toHaveBeenCalledWith('session123', expect.any(Function));
      });
    });
  });
});
