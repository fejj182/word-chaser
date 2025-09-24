import { render, screen, waitFor, act } from '@testing-library/react';
import { RoundResults } from '../RoundResults';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import {
  createMockRoom,
  createMockRoundResult,
} from '../../test-utils/round-test-utils';

// Mock the RoomContext
jest.mock('@/features/room-management/contexts/RoomContext');

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('RoundResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no round results exist', () => {
    it('should not render anything', () => {
      const room = createMockRoom();
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { container } = render(<RoundResults />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when current round is 1 (no previous rounds)', () => {
      const room = createMockRoom({ 
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          roundResults: {},
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { container } = render(<RoundResults />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render if current round is different from the round results', () => {
      const room = createMockRoom({ 
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 2,
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { container } = render(<RoundResults />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when round results exist', () => {
    it('should display results for the previous round', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
    });

    it('should display player scores correctly', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Host Player')).toBeInTheDocument();
      expect(screen.getByText('6 pts')).toBeInTheDocument(); // Host's score
      expect(screen.getByText('Test Player')).toBeInTheDocument();
      expect(screen.getByText('3 pts')).toBeInTheDocument(); // Player's score
    });

    it('should display round winner', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('🏆 Host Player wins this round!')).toBeInTheDocument();
    });

    it('should handle round with no winner (tie)', () => {
      const roundResult = createMockRoundResult(1);
      roundResult.roundWinner = null; // No winner
      roundResult.roundScores = {
        'host-123': 3,
        'player-456': 3,
      };

      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': roundResult,
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
      expect(screen.queryByText(/Round Winner/)).not.toBeInTheDocument();
      expect(screen.getByText('No winners this round')).toBeInTheDocument();
    });

    it('should handle round with no words submitted', () => {
      const roundResult = createMockRoundResult(1);
      roundResult.roundScores = {};
      roundResult.roundWords = {};
      roundResult.roundWinner = null;

      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': roundResult,
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
      expect(screen.getByText('No winners this round')).toBeInTheDocument();
    });
  });

  describe('when room changes', () => {
    it('should update when moving to next round', async () => {
      const room1 = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      const room2 = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 2,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
            'round-2': createMockRoundResult(2),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room1,
        loading: false,
      } as any);

      const { rerender } = render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();

      // Update to show round 2 results
      mockUseRoom.mockReturnValue({
        currentRoom: room2,
        loading: false,
      } as any);

      rerender(<RoundResults />);

      await waitFor(() => {
        expect(screen.getByText('Round 2 Results')).toBeInTheDocument();
      });
    });

    it('should reset when room changes to no results', async () => {
      const roomWithResults = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });
      const roomWithoutResults = createMockRoom();

      mockUseRoom.mockReturnValue({
        currentRoom: roomWithResults,
        loading: false,
      } as any);

      const { rerender } = render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();

      // Change to room without results
      mockUseRoom.mockReturnValue({
        currentRoom: roomWithoutResults,
        loading: false,
      } as any);

      rerender(<RoundResults />);

      await waitFor(() => {
        expect(screen.queryByText('Round 1 Results')).not.toBeInTheDocument();
      });
    });
  });

  describe('modal visibility', () => {
    it('should show modal when timer status is ended', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
      expect(screen.getByText('Next round starts in 5 seconds...')).toBeInTheDocument();
    });

    it('should hide modal when timer status is running', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'running',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { container } = render(<RoundResults />);

      expect(container.firstChild).toBeNull();
    });

  });

  describe('countdown functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display countdown timer starting at 5', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Next round starts in 5 seconds...')).toBeInTheDocument();
    });

    it('should countdown from 5 to 1', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Next round starts in 5 seconds...')).toBeInTheDocument();

      // Fast forward 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Next round starts in 4 seconds...')).toBeInTheDocument();

      // Fast forward 1 more second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Next round starts in 3 seconds...')).toBeInTheDocument();

      // Fast forward 1 more second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Next round starts in 2 seconds...')).toBeInTheDocument();

      // Fast forward 1 more second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Next round starts in 1 seconds...')).toBeInTheDocument();
    });

    it('should reset countdown when new round results appear', () => {
      const room1 = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });

      const room2 = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 2,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
            'round-2': createMockRoundResult(2),
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room1,
        loading: false,
      } as any);

      const { rerender } = render(<RoundResults />);

      expect(screen.getByText('Next round starts in 5 seconds...')).toBeInTheDocument();

      // Fast forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(screen.getByText('Next round starts in 3 seconds...')).toBeInTheDocument();

      // Update to show round 2 results - countdown should reset
      mockUseRoom.mockReturnValue({
        currentRoom: room2,
        loading: false,
      } as any);

      rerender(<RoundResults />);

      expect(screen.getByText('Next round starts in 5 seconds...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': createMockRoundResult(1),
          },
        },
      });
      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Round 1 Results');
    });
  });

  describe('edge cases', () => {
    it('should handle missing player data gracefully', () => {
      const room = createMockRoom({
        gameData: {
          ...createMockRoom().gameData!,
          currentRound: 1,
          timerStatus: 'ended',
          roundResults: {
            'round-1': {
              roundNumber: 1,
              roundScores: {
                'unknown-player': 5,
              },
              roundWords: {
                'unknown-player': [
                  {
                    word: 'TEST',
                    score: 5,
                    playerName: 'Unknown Player',
                    playerId: 'unknown-player',
                    submittedAt: Date.now(),
                  },
                ],
              },
              roundWinner: {
                playerId: 'unknown-player',
                playerName: 'Unknown Player',
                score: 5,
              },
            },
          },
        },
      });

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      render(<RoundResults />);

      expect(screen.getByText('Round 1 Results')).toBeInTheDocument();
      expect(screen.getByText('🏆 Unknown Player wins this round!')).toBeInTheDocument();
    });

    it('should handle room loading state', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        loading: true,
      } as any);

      const { container } = render(<RoundResults />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle room with no gameData', () => {
      const room = createMockRoom();
      delete room.gameData;

      mockUseRoom.mockReturnValue({
        currentRoom: room,
        loading: false,
      } as any);

      const { container } = render(<RoundResults />);
      expect(container.firstChild).toBeNull();
    });
  });
});

