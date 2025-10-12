import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  describe('Browser navigation handling', () => {
    let mockSendBeacon: jest.SpyInstance;
    let mockConfirm: jest.SpyInstance;

    beforeEach(() => {
      // Mock navigator.sendBeacon
      Object.defineProperty(navigator, 'sendBeacon', {
        writable: true,
        value: jest.fn().mockImplementation(() => true)
      });
      mockSendBeacon = jest.spyOn(navigator, 'sendBeacon');
      mockConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    });

    afterEach(() => {
      if (mockSendBeacon) {
        mockSendBeacon.mockRestore();
      }
      if (mockConfirm) {
        mockConfirm.mockRestore();
      }
    });

    it('should send beacon on beforeunload during active game', () => {
      render(
        <UserProvider>
          <RoomProvider>
            <GamePlayProvider>
              <GameScreen roomId="test-room" />
            </GamePlayProvider>
          </RoomProvider>
        </UserProvider>
      );

      // Simulate beforeunload event
      fireEvent(window, new Event('beforeunload'));

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/leave-room',
        JSON.stringify({
          roomId: 'test-room',
          userId: 'user1'
        })
      );
    });

    it('should not send beacon when no room or user', () => {
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

      fireEvent(window, new Event('beforeunload'));

      expect(mockSendBeacon).not.toHaveBeenCalled();
    });

    it('should handle browser back button with confirmation during active game', async () => {
      const mockLeaveRoom = jest.fn().mockResolvedValue(undefined);
      mockUseRoom.mockReturnValue({
        currentRoom: mockRoom,
        leaveRoom: mockLeaveRoom,
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

      // Simulate browser back button
      fireEvent(window, new Event('popstate'));

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to leave the game?');
      
      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should add popstate listener when game is playing', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      mockUseRoom.mockReturnValue({
        currentRoom: mockRoom, // status: 'playing'
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

      // Should add popstate listener for playing games
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should not add popstate listener when game is not playing', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      mockUseRoom.mockReturnValue({
        currentRoom: { ...mockRoom, status: 'finished' },
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

      // Should not add popstate listener for finished games
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should prevent navigation when user cancels confirmation', () => {
      mockConfirm.mockReturnValue(false);
      const mockPushState = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});

      render(
        <UserProvider>
          <RoomProvider>
            <GamePlayProvider>
              <GameScreen roomId="test-room" />
            </GamePlayProvider>
          </RoomProvider>
        </UserProvider>
      );

      fireEvent(window, new Event('popstate'));

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockPushState).toHaveBeenCalledWith(null, '', window.location.href);

      mockPushState.mockRestore();
    });
  });

  describe('Leave game functionality', () => {
    it('should call leaveRoom and redirect when leave game is triggered', async () => {
      const mockLeaveRoom = jest.fn().mockResolvedValue(undefined);
      mockUseRoom.mockReturnValue({
        currentRoom: mockRoom,
        leaveRoom: mockLeaveRoom,
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

      // Find and click the leave button (assuming it's in GameHeader)
      const leaveButton = screen.getByRole('button', { name: /leave/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockLeaveRoom).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle leave room errors gracefully', async () => {
      const mockLeaveRoom = jest.fn().mockRejectedValue(new Error('Leave failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockUseRoom.mockReturnValue({
        currentRoom: mockRoom,
        leaveRoom: mockLeaveRoom,
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

      const leaveButton = screen.getByRole('button', { name: /leave/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to leave game:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});