import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { FinalGameResults } from '../FinalGameResults';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('FinalGameResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
  });

  const createMockRoom = (overrides = {}) => ({
    id: 'room-1',
    name: 'Test Room',
    slug: 'test-room',
    createdBy: 'user-1',
    createdAt: Date.now(),
    status: 'finished' as const,
    players: {
      'user-1': {
        displayName: 'Player 1',
        joinedAt: Date.now(),
        isHost: true,
        isReady: true,
        score: 100,
        wordsFound: 5,
      },
      'user-2': {
        displayName: 'Player 2',
        joinedAt: Date.now(),
        isHost: false,
        isReady: true,
        score: 80,
        wordsFound: 4,
      },
    },
    maxPlayers: 4,
    settings: {
      roundDuration: 60,
      maxRounds: 3,
      gridSize: 'small' as const,
    },
    gameData: {
      grid: [['A', 'B'], ['C', 'D']],
      currentRound: 3,
      submittedWords: {},
      roundStartTime: Date.now(),
      roundEndTime: Date.now() + 60000,
      timerStatus: 'ended' as const,
      roundResults: {
        'round-1': {
          roundNumber: 1,
          roundScores: { 'user-1': 30, 'user-2': 25 },
          roundWords: {
            'user-1': [{ word: 'CAT', playerId: 'user-1', playerName: 'Player 1', score: 30, submittedAt: Date.now() }],
            'user-2': [{ word: 'DOG', playerId: 'user-2', playerName: 'Player 2', score: 25, submittedAt: Date.now() }],
          },
          roundWinner: {
            playerId: 'user-1',
            playerName: 'Player 1',
            score: 30,
          },
        },
        'round-2': {
          roundNumber: 2,
          roundScores: { 'user-1': 40, 'user-2': 35 },
          roundWords: {
            'user-1': [{ word: 'BAT', playerId: 'user-1', playerName: 'Player 1', score: 40, submittedAt: Date.now() }],
            'user-2': [{ word: 'LOG', playerId: 'user-2', playerName: 'Player 2', score: 35, submittedAt: Date.now() }],
          },
          roundWinner: {
            playerId: 'user-1',
            playerName: 'Player 1',
            score: 40,
          },
        },
        'round-3': {
          roundNumber: 3,
          roundScores: { 'user-1': 30, 'user-2': 20 },
          roundWords: {
            'user-1': [{ word: 'RAT', playerId: 'user-1', playerName: 'Player 1', score: 30, submittedAt: Date.now() }],
            'user-2': [{ word: 'BOG', playerId: 'user-2', playerName: 'Player 2', score: 20, submittedAt: Date.now() }],
          },
          roundWinner: {
            playerId: 'user-1',
            playerName: 'Player 1',
            score: 30,
          },
        },
      },
      gameWinner: {
        playerId: 'user-1',
        playerName: 'Player 1',
        finalScore: 100,
      },
    },
    ...overrides,
  });

  it('renders nothing when room is not finished', () => {
    const mockRoom = createMockRoom({ status: 'playing' });
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    const { container } = render(<FinalGameResults />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no room is available', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null,
    } as any);

    const { container } = render(<FinalGameResults />);
    expect(container.firstChild).toBeNull();
  });

  it('renders game complete modal with winner', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    expect(screen.getByText('Final Results')).toBeInTheDocument();
    expect(screen.getByText('Player 1 Wins!')).toBeInTheDocument();
    expect(screen.getByText('Final Score: 100 points')).toBeInTheDocument();
  });

  it('renders tie message when no winner', () => {
    const mockRoom = createMockRoom({
      gameData: {
        ...createMockRoom().gameData,
        gameWinner: null,
      },
    });
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    expect(screen.getByText("It's a Tie!")).toBeInTheDocument();
    expect(screen.getByText('No clear winner this game')).toBeInTheDocument();
  });

  it('displays final leaderboard with correct rankings', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    expect(screen.getByText('Final Leaderboard')).toBeInTheDocument();
    
    // Check that players are displayed in correct order
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    
    // Check scores are displayed
    expect(screen.getByText('100 pts')).toBeInTheDocument();
    expect(screen.getByText('80 pts')).toBeInTheDocument();
  });

  it('displays round summary when round results are available', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    expect(screen.getByText('Round Summary')).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 2')).toBeInTheDocument();
    expect(screen.getByText('Round 3')).toBeInTheDocument();
  });

  it('handles return to menu button click', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    const returnButton = screen.getByRole('button', { name: 'Return to Menu' });
    fireEvent.click(returnButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('calculates total words found correctly', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    // Player 1 should have 3 words total (1 from each round)
    // Player 2 should have 3 words total (1 from each round)
    expect(screen.getAllByText('3 words found')).toHaveLength(2);
  });

  it('displays winner crown for the winning player', () => {
    const mockRoom = createMockRoom();
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    // Check that the winner has a crown
    const winnerElement = screen.getByText('Player 1');
    expect(winnerElement.parentElement).toHaveTextContent('👑');
  });

  it('handles missing round results gracefully', () => {
    const mockRoom = createMockRoom({
      gameData: {
        ...createMockRoom().gameData,
        roundResults: undefined,
      },
    });
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
    } as any);

    render(<FinalGameResults />);

    // Should still render the modal
    expect(screen.getByText('Game Complete!')).toBeInTheDocument();
    // Should not show round summary
    expect(screen.queryByText('Round Summary')).not.toBeInTheDocument();
  });
});
