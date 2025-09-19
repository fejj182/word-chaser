import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameTimer } from '../GameTimer';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { getRemainingTime } from '@/lib/firebase/round-utils';
import { User } from 'firebase/auth';

// Mock the dependencies
jest.mock('@/features/room-management/contexts/RoomContext');
jest.mock('@/features/user-management/hooks/useAuth');
jest.mock('@/lib/firebase/round-utils');

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetRemainingTime = getRemainingTime as jest.MockedFunction<typeof getRemainingTime>;

describe('GameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Default mocks
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user', displayName: 'Test User' } as User,
      loading: false,
    });

    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room',
        players: {
          'test-user': {
            displayName: 'Test User',
            isHost: true,
            score: 0,
            joinedAt: Date.now(),
            isReady: true,
            wordsFound: 0,
          },
        },
        gameData: {
          grid: [[]],
          currentRound: 1,
          timerStatus: 'running',
        },
      },
      loading: false,
    });

    mockGetRemainingTime.mockReturnValue(180); // 3 minutes
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders timer with initial time', () => {
    render(<GameTimer />);

    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('updates timer countdown', () => {
    // Mock time decreasing
    mockGetRemainingTime.mockReturnValue(150); // 2:30
    render(<GameTimer />);

    expect(screen.getByText('2:30')).toBeInTheDocument();
  });
});
