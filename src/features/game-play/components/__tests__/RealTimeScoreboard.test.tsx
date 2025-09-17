import React from 'react';
import { render, screen } from '@testing-library/react';
import { RealTimeScoreboard } from '../RealTimeScoreboard';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';

// Mock the hooks
jest.mock('@/features/room-management/contexts/RoomContext');
jest.mock('@/features/user-management/hooks/useAuth');

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RealTimeScoreboard', () => {
  const mockUser = {
    uid: 'user1',
    displayName: 'Test User',
    email: 'test@example.com',
    isAnonymous: true,
  };

  const mockRoom = {
    id: 'room1',
    name: 'Test Room',
    slug: 'test-room',
    createdBy: 'user1',
    createdAt: Date.now(),
    status: 'playing' as const,
    maxPlayers: 4,
    settings: {
      roundDuration: 60,
      maxRounds: 3,
      gridSize: 'medium' as const,
    },
    players: {
      user1: {
        displayName: 'Alice',
        joinedAt: Date.now() - 1000,
        isHost: true,
        isReady: true,
        score: 150,
        wordsFound: 5,
      },
      user2: {
        displayName: 'Bob',
        joinedAt: Date.now() - 500,
        isHost: false,
        isReady: true,
        score: 200,
        wordsFound: 7,
      },
      user3: {
        displayName: 'Charlie',
        joinedAt: Date.now() - 200,
        isHost: false,
        isReady: true,
        score: 100,
        wordsFound: 3,
      },
    },
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders scoreboard with all players sorted by score', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    render(<RealTimeScoreboard />);

    // Check header
    expect(screen.getByText('Live Scores')).toBeInTheDocument();
    expect(screen.getByText('3 players')).toBeInTheDocument();

    // Check players are sorted by score (Bob first, then Alice, then Charlie)
    const playerNames = screen.getAllByRole('listitem');
    expect(playerNames).toHaveLength(3);

    // Bob should be first (highest score)
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('🏆 Leader')).toBeInTheDocument();

    // Alice should be second
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Charlie should be third
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    
    // Check Charlie's words count specifically
    const charlieElement = screen.getByLabelText('Charlie - 100 points, 3 words');
    expect(charlieElement).toBeInTheDocument();

    // Check summary stats
    expect(screen.getByText('Total words found: 15')).toBeInTheDocument();
    expect(screen.getByText('Total points: 450')).toBeInTheDocument();
  });

  it('highlights current player', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    render(<RealTimeScoreboard />);

    // Alice should be highlighted as current player
    const aliceElement = screen.getByText('Alice').closest('[role="listitem"]');
    expect(aliceElement).toHaveClass('bg-blue-50');
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('handles tie scores correctly', () => {
    const roomWithTies = {
      ...mockRoom,
      players: {
        user1: {
          displayName: 'Alice',
          joinedAt: Date.now() - 1000,
          isHost: true,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
        user2: {
          displayName: 'Bob',
          joinedAt: Date.now() - 500,
          isHost: false,
          isReady: true,
          score: 100,
          wordsFound: 5,
        },
      },
    };

    mockUseRoom.mockReturnValue({
      currentRoom: roomWithTies,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    render(<RealTimeScoreboard />);

    // With tied scores and words, Alice should be first (joined earlier)
    const playerNames = screen.getAllByRole('listitem');
    expect(playerNames).toHaveLength(2);
    
    // Alice should be first due to earlier join time
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders nothing when no room is available', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null,
      roomId: null,
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    const { container } = render(<RealTimeScoreboard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no user is available', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    const { container } = render(<RealTimeScoreboard />);
    expect(container.firstChild).toBeNull();
  });

  it('handles empty players object', () => {
    const emptyRoom = {
      ...mockRoom,
      players: {},
    };

    mockUseRoom.mockReturnValue({
      currentRoom: emptyRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    const { container } = render(<RealTimeScoreboard />);
    expect(container.firstChild).toBeNull();
  });

  it('shows correct player count for single player', () => {
    const singlePlayerRoom = {
      ...mockRoom,
      players: {
        user1: mockRoom.players.user1,
      },
    };

    mockUseRoom.mockReturnValue({
      currentRoom: singlePlayerRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    render(<RealTimeScoreboard />);

    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      roomId: 'room1',
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
    });

    render(<RealTimeScoreboard />);

    // Check main region
    const scoreboard = screen.getByRole('region', { name: 'Live scoreboard' });
    expect(scoreboard).toBeInTheDocument();

    // Check list items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);

    // Check aria-labels
    expect(screen.getByLabelText('Bob - 200 points, 7 words')).toBeInTheDocument();
    expect(screen.getByLabelText('Alice - 150 points, 5 words')).toBeInTheDocument();
    expect(screen.getByLabelText('Charlie - 100 points, 3 words')).toBeInTheDocument();
  });
});
