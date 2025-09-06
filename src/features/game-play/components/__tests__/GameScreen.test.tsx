import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GameScreen } from '../GameScreen';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';
import { GamePlayProvider } from '../../contexts/GamePlayContext';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  ...jest.requireActual('@/features/room-management/contexts/RoomContext'),
  useRoom: jest.fn(),
}));

jest.mock('@/features/guest-auth/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseRoom = require('@/features/room-management/contexts/RoomContext').useRoom;
const mockUseAuth = require('@/features/guest-auth/hooks/useAuth').useAuth;

describe('GameScreen', () => {
  const mockRoom = {
    id: 'test-room',
    name: 'Test Room',
    slug: 'test-room',
    createdBy: 'user1',
    createdAt: Date.now(),
    status: 'playing' as const,
    players: [
      {
        id: 'user1',
        displayName: 'Test User',
        joinedAt: Date.now(),
        isHost: true,
        isReady: true,
      }
    ],
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
    expect(await screen.findByText('Test User')).toBeInTheDocument();
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
        players: [], // No players
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
});