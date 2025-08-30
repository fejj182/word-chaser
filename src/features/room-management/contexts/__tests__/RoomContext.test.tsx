import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoomProvider, useRoom } from '../RoomContext';
import { SessionProvider, useSession } from '@/features/session-management/contexts/SessionContext';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { Session } from '@/features/session-management/types/session';
import { Room } from '@/features/room-management/types/room';

// Mock the SessionContext
jest.mock('@/features/session-management/contexts/SessionContext', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useAuth hook
jest.mock('@/features/guest-auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component to access room context
const TestComponent = () => {
  const { 
    currentRoom, 
    isLoading, 
    error, 
    createRoom, 
    loadRoom, 
    joinRoom, 
    leaveRoom, 
    updatePlayerReady, 
    startGame, 
    clearError 
  } = useRoom();
  
  const handleCreateRoom = async () => {
    try {
      await createRoom({ maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } }, 'Test User');
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
      <SessionProvider>
        <RoomProvider>
          {component}
        </RoomProvider>
      </SessionProvider>
    </UserProvider>
  );
};

describe('RoomContext', () => {
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

  const mockPartialSession = {
    id: 'session123'
  };

  const mockSessionMethods = {
    createSession: jest.fn(),
    loadSession: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    setPlayerReady: jest.fn(),
    startSession: jest.fn(),
    subscribeToSession: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseSession.mockReturnValue({
      currentSession: null,
      isLoading: false,
      error: null,
      ...mockSessionMethods,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state when no session', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('current-room')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should throw error when used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        try {
          useRoom();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error-message">{(error as Error).message}</div>;
        }
      };

      render(<TestComponentOutsideProvider />);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'useRoom must be used within a RoomProvider'
      );
    });
  });

  describe('Data Transformation', () => {
    it('should transform session data to room data correctly', () => {
      mockUseSession.mockReturnValue({
        currentSession: mockSession,
        isLoading: false,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      const roomData = JSON.parse(screen.getByTestId('current-room').textContent || 'null');
      expect(roomData.id).toBe('session123');
      expect(roomData.name).toBe('Test Session');
      expect(roomData.slug).toBe('Test Session'); // name is used as slug
      expect(roomData.status).toBe('waiting');
      expect(roomData.players).toHaveLength(1);
      expect(roomData.players[0].id).toBe('user123');
      expect(roomData.players[0].displayName).toBe('Test User');
      expect(roomData.players[0].isHost).toBe(true);
      expect(roomData.players[0].isReady).toBe(true);
      expect(roomData.maxPlayers).toBe(4);
      expect(roomData.settings).toEqual({ roundDuration: 60, maxRounds: 5 });
      expect(roomData.createdBy).toBe('user123'); // host player id
      expect(roomData.createdAt).toBeDefined();
      expect(roomData.players[0].joinedAt).toBeDefined();
    });

    it('should handle partial session data', () => {
      mockUseSession.mockReturnValue({
        currentSession: mockPartialSession,
        isLoading: false,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      const roomData = JSON.parse(screen.getByTestId('current-room').textContent || 'null');
      expect(roomData.id).toBe('session123');
      // Should not have other properties since it's a partial session
      expect(roomData.name).toBeUndefined();
      expect(roomData.players).toBeUndefined();
    });

    it('should reflect session loading state', () => {
      mockUseSession.mockReturnValue({
        currentSession: null,
        isLoading: true,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should reflect session error state', () => {
      mockUseSession.mockReturnValue({
        currentSession: null,
        isLoading: false,
        error: 'Test error',
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });
  });

  describe('Method Delegation', () => {
    it('should delegate createRoom to session.createSession', async () => {
      mockSessionMethods.createSession.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.createSession).toHaveBeenCalledWith(
          { maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } },
          'Test User'
        );
      });
    });

    it('should delegate loadRoom to session.loadSession', async () => {
      mockSessionMethods.loadSession.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Load Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.loadSession).toHaveBeenCalledWith('test-room-id');
      });
    });

    it('should delegate joinRoom to session.joinSession', async () => {
      mockSessionMethods.joinSession.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.joinSession).toHaveBeenCalledWith('test-room-id', 'Test User');
      });
    });

    it('should delegate leaveRoom to session.leaveSession', async () => {
      mockSessionMethods.leaveSession.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Leave Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.leaveSession).toHaveBeenCalled();
      });
    });

    it('should delegate updatePlayerReady to session.setPlayerReady', async () => {
      mockSessionMethods.setPlayerReady.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Update Ready'));
      
      await waitFor(() => {
        expect(mockSessionMethods.setPlayerReady).toHaveBeenCalledWith(true);
      });
    });

    it('should delegate startGame to session.startSession', async () => {
      mockSessionMethods.startSession.mockResolvedValue(undefined);
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Start Game'));
      
      await waitFor(() => {
        expect(mockSessionMethods.startSession).toHaveBeenCalled();
      });
    });

    it('should delegate clearError to session.clearError', () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Clear Error'));
      
      expect(mockSessionMethods.clearError).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate session errors', async () => {
      mockSessionMethods.createSession.mockRejectedValue(new Error('Session creation failed'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.createSession).toHaveBeenCalled();
      });
    });

    it('should handle session method errors gracefully', async () => {
      mockSessionMethods.joinSession.mockRejectedValue(new Error('Join failed'));
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Join Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.joinSession).toHaveBeenCalled();
      });
    });
  });

  describe('Data Transformation Edge Cases', () => {
    it('should handle session with no host player', () => {
      const sessionWithoutHost: Session = {
        ...mockSession,
        players: [
          { id: 'user123', displayName: 'Test User', isHost: false, isReady: true }
        ]
      };

      mockUseSession.mockReturnValue({
        currentSession: sessionWithoutHost,
        isLoading: false,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      const roomData = JSON.parse(screen.getByTestId('current-room').textContent || 'null');
      expect(roomData.createdBy).toBe(''); // No host player found
    });

    it('should handle session with multiple players', () => {
      const sessionWithMultiplePlayers: Session = {
        ...mockSession,
        players: [
          { id: 'user123', displayName: 'Test User', isHost: true, isReady: true },
          { id: 'user456', displayName: 'Another User', isHost: false, isReady: false }
        ]
      };

      mockUseSession.mockReturnValue({
        currentSession: sessionWithMultiplePlayers,
        isLoading: false,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      const roomData = JSON.parse(screen.getByTestId('current-room').textContent || 'null');
      expect(roomData.players).toHaveLength(2);
      expect(roomData.players[0].id).toBe('user123');
      expect(roomData.players[1].id).toBe('user456');
      expect(roomData.createdBy).toBe('user123'); // First player is host
    });

    it('should handle different session statuses', () => {
      const playingSession: Session = {
        ...mockSession,
        status: 'playing'
      };

      mockUseSession.mockReturnValue({
        currentSession: playingSession,
        isLoading: false,
        error: null,
        ...mockSessionMethods,
      });

      renderWithProvider(<TestComponent />);
      
      const roomData = JSON.parse(screen.getByTestId('current-room').textContent || 'null');
      expect(roomData.status).toBe('playing');
    });
  });

  describe('Parameter Transformation', () => {
    it('should transform room parameters to session parameters correctly', async () => {
      mockSessionMethods.createSession.mockResolvedValue('session123');
      
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByText('Create Room'));
      
      await waitFor(() => {
        expect(mockSessionMethods.createSession).toHaveBeenCalledWith(
          { maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } },
          'Test User'
        );
      });
    });
  });
});
