import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GameScreen } from '../GameScreen';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { GamePlayProvider } from '../../contexts/GamePlayContext';
import { UserProvider } from '@/features/user-management/contexts/UserContext';

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  ...jest.requireActual('@/features/room-management/contexts/RoomContext'),
  useRoom: jest.fn(),
}));

jest.mock('@/features/user-management/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRoom = jest.mocked(jest.requireMock('@/features/room-management/contexts/RoomContext').useRoom);
const mockUseAuth = jest.mocked(jest.requireMock('@/features/user-management/hooks/useAuth').useAuth);
const mockUseRouter = jest.mocked(jest.requireMock('next/navigation').useRouter);

describe('GameScreen', () => {
  const mockRoom = {
    id: 'test-room',
    name: 'Test Room',
    slug: 'test-room',
    createdBy: 'user1',
    createdAt: Date.now(),
    status: 'playing' as const,
    players: {
      'user1': {
        displayName: 'Test User',
        joinedAt: Date.now(),
        isHost: true,
        isReady: true,
        score: 0,
        wordsFound: 0,
      }
    },
    maxPlayers: 4,
    settings: {
      roundDuration: 60,
      maxRounds: 5,
      gridSize: 'medium' as const,
    },
    gameData: {
      grid: [
        ['A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
        ['I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P']
      ],
      currentRound: 1
    },
  };

  const mockUser = {
    uid: 'user1',
    displayName: 'Test User',
  };

  beforeEach(() => {
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      leaveRoom: jest.fn(),
      loadRoom: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: mockUser,
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render game screen with room data', async () => {
    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    expect(await screen.findByText('Test Room')).toBeInTheDocument();
    expect(await screen.getAllByText('Test User')).toHaveLength(2); // One in header, one in scoreboard
  });

  it('should load grid from room data', async () => {
    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    // Wait for the grid to be loaded
    await waitFor(() => {
      // The grid should be loaded from room data
      // We can verify this by checking if the LetterGrid component is rendered
      expect(screen.getByText('Letter Grid')).toBeInTheDocument();
    });
  });

  it('should not render when room is not loaded', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null,
      leaveRoom: jest.fn(),
      loadRoom: jest.fn(),
    });

    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    expect(screen.queryByText('Test Room')).not.toBeInTheDocument();
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });

    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    expect(screen.queryByText('Test Room')).not.toBeInTheDocument();
  });

  it('should not render when current player is not found', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: {
        ...mockRoom,
        players: {}, // No players
      },
      leaveRoom: jest.fn(),
      loadRoom: jest.fn(),
    });

    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    expect(screen.queryByText('Test Room')).not.toBeInTheDocument();
  });

  it('should redirect to lobby when room is not in playing or finished status', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: { ...mockRoom, status: 'waiting', players: { ...mockRoom.players, 'user1': { ...mockRoom.players['user1'], uid: 'user1' } } },
      leaveRoom: jest.fn(),
      loadRoom: jest.fn(),
    });

    render(
      <UserProvider>
        <RoomProvider>
          <GamePlayProvider>
            <GameScreen roomId="test-room" />
          </GamePlayProvider>
        </RoomProvider>
      </UserProvider>
    );

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});