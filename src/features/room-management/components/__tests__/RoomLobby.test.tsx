import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoomLobby from '../RoomLobby';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { updatePlayerReady, startGame } from '@/lib/firebase/room-utils';

jest.mock('@/features/room-management/contexts/RoomContext');
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
  const mockUpdatePlayerReady = jest.fn();
  const mockStartGame = jest.fn();

  const createMockRoomContext = (overrides: Partial<ReturnType<typeof useRoom>> = {}) => ({
    currentRoom: null,
    isLoading: false,
    error: null,
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: mockLeaveRoom,
    updatePlayerReady: mockUpdatePlayerReady,
    startGame: mockStartGame,
    clearError: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
  });

  describe('General Functionality', () => {
    it('displays room name and copy hint', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getAllByText('Test Room').length).toBeGreaterThanOrEqual(1);
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByText('Game Settings')).toBeInTheDocument();
      expect(screen.getByText('Round Duration:')).toBeInTheDocument();
      expect(screen.getByText('60 seconds')).toBeInTheDocument();
      expect(screen.getByText('Max Rounds:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      mockLeaveRoom.mockResolvedValue(undefined);

      render(<RoomLobby />);

      fireEvent.click(screen.getByRole('button', { name: /leave room/i }));

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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
        isLoading: true,
      }));

      render(<RoomLobby />);

      expect(screen.getByRole('button', { name: /leave room/i })).toBeDisabled();
    });

    it('returns null when room data is incomplete', () => {
      const incompleteRoom = { id: 'room123' };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: incompleteRoom,
      }));

      const { container } = render(<RoomLobby />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when no user or room', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: null,
      }));

      const { container } = render(<RoomLobby />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Single Player Scenarios', () => {
    it('displays single player count', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByText('Players (1/4)')).toBeInTheDocument();
    });

    it('displays single player information', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ready/i })).toBeInTheDocument();
    });

    it('highlights current user', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      const playerRow = screen.getByTestId('player-row-user123');
      expect(playerRow).toHaveClass('bg-blue-50');
    });

    it('shows ready toggle button for current user', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByRole('button', { name: /not ready/i })).toBeInTheDocument();
    });

    it('calls updatePlayerReady when ready toggle is clicked', async () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      fireEvent.click(screen.getByRole('button', { name: /not ready/i }));

      await waitFor(() => {
        expect(mockUpdatePlayerReady).toHaveBeenCalledWith(false);
      });
    });

    it('shows start game button for host but disables it when not enough players', () => {
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
        },
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: singlePlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).toBeDisabled();
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
          isReady: false,
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
      },
    };

    it('displays multiple players count', () => {
      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: multiPlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByText('Players (2/4)')).toBeInTheDocument();
    });

    it('displays all players with their information', () => {
      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: multiPlayerRoom,
      }));

      render(<RoomLobby />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getAllByText('Not Ready')).toHaveLength(2);
    });

    it('does not show ready toggle button for other users', () => {
      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: multiPlayerRoom,
      }));

      render(<RoomLobby />);

      // Both players show "Not Ready" status, but only current user has toggle button
      const statusTexts = screen.getAllByText('Not Ready');
      expect(statusTexts).toHaveLength(2); // Both players show status
      
      // Check that only current user has the toggle button (not just status text)
      const toggleButtons = screen.getAllByRole('button', { name: /ready/i });
      expect(toggleButtons).toHaveLength(1); // Only current user has toggle button
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

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: roomWithAllReady,
      }));

      render(<RoomLobby />);

      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start game/i })).not.toBeDisabled();
    });

    it('disables start game button when not all players are ready', () => {
      render(<RoomLobby />);

      const startGameButton = screen.getByRole('button', { name: /start game/i });
      expect(startGameButton).toBeInTheDocument();
      expect(startGameButton).toHaveClass('btn--disabled');
      // The button is disabled via CSS class, not HTML disabled attribute
    });

    it('does not show start game button for non-host users', () => {
      const roomWithNonHost = {
        ...multiPlayerRoom,
        players: [
          { ...multiPlayerRoom.players[0], isHost: false },
          { ...multiPlayerRoom.players[1], isHost: true },
        ],
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: roomWithNonHost,
      }));

      render(<RoomLobby />);

      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    it('calls startGame when start game button is clicked', async () => {
      mockStartGame.mockResolvedValue(undefined);

      const roomWithAllReady = {
        ...multiPlayerRoom,
        players: [
          { ...multiPlayerRoom.players[0], isReady: true },
          { ...multiPlayerRoom.players[1], isReady: true },
        ],
      };

      mockUseRoom.mockReturnValue(createMockRoomContext({
        currentRoom: roomWithAllReady,
      }));

      render(<RoomLobby />);

      fireEvent.click(screen.getByRole('button', { name: /start game/i }));

      await waitFor(() => {
        expect(mockStartGame).toHaveBeenCalled();
      });
    });
  });
});
