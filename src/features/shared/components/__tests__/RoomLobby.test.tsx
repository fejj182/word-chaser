import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomLobby from '../RoomLobby';
import { useRoom } from '@/features/shared/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { updatePlayerReady, startGame } from '@/lib/firebase/room-utils';

// Mock dependencies
jest.mock('@/features/shared/contexts/RoomContext');
jest.mock('@/features/guest-auth/hooks/useAuth');
jest.mock('@/lib/firebase/room-utils');

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUpdatePlayerReady = updatePlayerReady as jest.MockedFunction<typeof updatePlayerReady>;
const mockStartGame = startGame as jest.MockedFunction<typeof startGame>;

describe('RoomLobby', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: null,
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
    providerId: '',
  };

  const mockLeaveRoom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
  });

  describe('General Functionality', () => {
    it('displays room name and code', () => {
      const singlePlayerRoom = {
        id: 'room123',
        name: 'Test Room',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'waiting' as const,
        players: [
          {
            id: 'user123',
            displayName: 'Test User',
            joinedAt: Date.now(),
            isHost: true,
            isReady: true,
          },
        ],
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          wordLength: 5,
          allowRepeats: false,
        },
      };

      mockUseRoom.mockReturnValue({
        currentRoom: singlePlayerRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.getByText('Test Room')).toBeInTheDocument();
      expect(screen.getByText('Room Code:')).toBeInTheDocument();
      expect(screen.getByText('room123')).toBeInTheDocument();
    });

    it('displays game settings', () => {
      const singlePlayerRoom = {
        id: 'room123',
        name: 'Test Room',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'waiting' as const,
        players: [
          {
            id: 'user123',
            displayName: 'Test User',
            joinedAt: Date.now(),
            isHost: true,
            isReady: true,
          },
        ],
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          wordLength: 5,
          allowRepeats: false,
        },
      };

      mockUseRoom.mockReturnValue({
        currentRoom: singlePlayerRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.getByText('Game Settings')).toBeInTheDocument();
      expect(screen.getByText('Round Duration:')).toBeInTheDocument();
      expect(screen.getByText('60 seconds')).toBeInTheDocument();
      expect(screen.getByText('Max Rounds:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Word Length:')).toBeInTheDocument();
      expect(screen.getByText('5 letters')).toBeInTheDocument();
      expect(screen.getByText('Allow Repeats:')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('calls leaveRoom when leave room button is clicked', async () => {
      const singlePlayerRoom = {
        id: 'room123',
        name: 'Test Room',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'waiting' as const,
        players: [
          {
            id: 'user123',
            displayName: 'Test User',
            joinedAt: Date.now(),
            isHost: true,
            isReady: true,
          },
        ],
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          wordLength: 5,
          allowRepeats: false,
        },
      };

      mockUseRoom.mockReturnValue({
        currentRoom: singlePlayerRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      mockLeaveRoom.mockResolvedValue(undefined);

      render(<RoomLobby />);

      fireEvent.click(screen.getByText('Leave Room'));

      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalled();
      });
    });

    it('disables buttons when loading', () => {
      const singlePlayerRoom = {
        id: 'room123',
        name: 'Test Room',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'waiting' as const,
        players: [
          {
            id: 'user123',
            displayName: 'Test User',
            joinedAt: Date.now(),
            isHost: true,
            isReady: true,
          },
        ],
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          wordLength: 5,
          allowRepeats: false,
        },
      };

      mockUseRoom.mockReturnValue({
        currentRoom: singlePlayerRoom,
        isLoading: true,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.getByText('Leave Room')).toBeDisabled();
    });

    it('shows loading spinner when room data is incomplete', () => {
      const partialRoom = { id: 'room123' };

      mockUseRoom.mockReturnValue({
        currentRoom: partialRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.getByText('Loading room data...')).toBeInTheDocument();
    });

    it('returns null when no user or room', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      const { container } = render(<RoomLobby />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Single Player Scenarios', () => {
    const singlePlayerRoom = {
      id: 'room123',
      name: 'Test Room',
      createdBy: 'user123',
      createdAt: Date.now(),
      status: 'waiting' as const,
      players: [
        {
          id: 'user123',
          displayName: 'Test User',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
        },
      ],
      maxPlayers: 4,
      settings: {
        roundDuration: 60,
        maxRounds: 5,
        wordLength: 5,
        allowRepeats: false,
      },
    };

    beforeEach(() => {
      mockUseRoom.mockReturnValue({
        currentRoom: singlePlayerRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });
    });

    it('displays single player count', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Players (1/4)')).toBeInTheDocument();
    });

    it('displays single player information', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('highlights current user', () => {
      render(<RoomLobby />);

      const currentUserRow = screen.getByTestId('player-row-user123');
      expect(currentUserRow).toHaveClass('bg-blue-50');
    });

    it('shows ready toggle button for current user', () => {
      render(<RoomLobby />);

      expect(screen.getByRole('button', { name: /not ready/i })).toBeInTheDocument();
    });

    it('calls updatePlayerReady when ready toggle is clicked', async () => {
      mockUpdatePlayerReady.mockResolvedValue();

      render(<RoomLobby />);

      fireEvent.click(screen.getByRole('button', { name: /not ready/i }));

      await waitFor(() => {
        expect(mockUpdatePlayerReady).toHaveBeenCalledWith('room123', 'user123', false);
      });
    });

    it('shows start game button for host but disables it when not enough players', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Start Game')).toBeInTheDocument();
      expect(screen.getByText('Start Game')).toBeDisabled();
      expect(screen.getByText('Need at least 2 players to start the game')).toBeInTheDocument();
    });
  });

  describe('Multiple Players Scenarios', () => {
    const multiPlayerRoom = {
      id: 'room123',
      name: 'Test Room',
      createdBy: 'user123',
      createdAt: Date.now(),
      status: 'waiting' as const,
      players: [
        {
          id: 'user123',
          displayName: 'Test User',
          joinedAt: Date.now(),
          isHost: true,
          isReady: true,
        },
        {
          id: 'user456',
          displayName: 'Another User',
          joinedAt: Date.now(),
          isHost: false,
          isReady: false,
        },
      ],
      maxPlayers: 4,
      settings: {
        roundDuration: 60,
        maxRounds: 5,
        wordLength: 5,
        allowRepeats: false,
      },
    };

    beforeEach(() => {
      mockUseRoom.mockReturnValue({
        currentRoom: multiPlayerRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });
    });

    it('displays multiple players count', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Players (2/4)')).toBeInTheDocument();
    });

    it('displays all players with their information', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getAllByText('Not Ready')).toHaveLength(2); // Button and span
    });

    it('does not show ready toggle button for other users', () => {
      render(<RoomLobby />);

      const anotherUserElement = screen.getByText('Another User').closest('div');
      expect(anotherUserElement).not.toHaveTextContent('Not Ready');
    });

    it('highlights current user and not other users', () => {
      render(<RoomLobby />);

      const currentUserRow = screen.getByTestId('player-row-user123');
      const otherUserRow = screen.getByTestId('player-row-user456');
      
      expect(currentUserRow).toHaveClass('bg-blue-50');
      expect(otherUserRow).toHaveClass('bg-gray-50');
    });

    it('shows start game button for host when all conditions are met', () => {
      const roomWithAllReady = {
        ...multiPlayerRoom,
        players: [
          { ...multiPlayerRoom.players[0], isReady: true },
          { ...multiPlayerRoom.players[1], isReady: true },
        ],
      };

      mockUseRoom.mockReturnValue({
        currentRoom: roomWithAllReady,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.getByText('Start Game')).toBeInTheDocument();
      expect(screen.getByText('Start Game')).not.toBeDisabled();
    });

    it('disables start game button when not all players are ready', () => {
      render(<RoomLobby />);

      expect(screen.getByText('Start Game')).toBeInTheDocument();
      expect(screen.getByText('Start Game')).toBeDisabled();
      expect(screen.getByText('Waiting for all players to be ready...')).toBeInTheDocument();
    });

    it('does not show start game button for non-host users', () => {
      const roomWithNonHost = {
        ...multiPlayerRoom,
        players: [
          { ...multiPlayerRoom.players[0], isHost: false },
          { ...multiPlayerRoom.players[1], isHost: true },
        ],
      };

      mockUseRoom.mockReturnValue({
        currentRoom: roomWithNonHost,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    it('calls startGame when start game button is clicked', async () => {
      mockStartGame.mockResolvedValue();

      const roomWithAllReady = {
        ...multiPlayerRoom,
        players: [
          { ...multiPlayerRoom.players[0], isReady: true },
          { ...multiPlayerRoom.players[1], isReady: true },
        ],
      };

      mockUseRoom.mockReturnValue({
        currentRoom: roomWithAllReady,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: mockLeaveRoom,
        clearError: jest.fn(),
      });

      render(<RoomLobby />);

      fireEvent.click(screen.getByText('Start Game'));

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalledWith('room123');
      });
    });
  });
});
