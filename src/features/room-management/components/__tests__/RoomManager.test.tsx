import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomManager from '../RoomManager';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

// Mock dependencies
jest.mock('@/features/room-management/contexts/RoomContext');
jest.mock('../CreateRoom', () => {
  return function MockCreateRoom() {
    return <div data-testid="create-room">Create Room Component</div>;
  };
});
jest.mock('../JoinRoom', () => {
  return function MockJoinRoom() {
    return <div data-testid="join-room">Join Room Component</div>;
  };
});
jest.mock('../RoomLobby', () => {
  return function MockRoomLobby() {
    return <div data-testid="room-lobby">Room Lobby Component</div>;
  };
});

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('RoomManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoom.mockReturnValue({
      currentRoom: null,
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      clearError: jest.fn(),
    });
  });

  describe('Main Menu', () => {
    it('shows main menu when no room is active', () => {
      render(<RoomManager />);

      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByText('Join Existing Room')).toBeInTheDocument();
    });

    it('navigates to create room view when create button is clicked', () => {
      render(<RoomManager />);

      fireEvent.click(screen.getByText('Create a New Room'));

      expect(screen.getByTestId('create-room')).toBeInTheDocument();
      expect(screen.getByText('← Back to Menu')).toBeInTheDocument();
    });

    it('navigates to join room view when join button is clicked', () => {
      render(<RoomManager />);

      fireEvent.click(screen.getByText('Join Existing Room'));

      expect(screen.getByTestId('join-room')).toBeInTheDocument();
      expect(screen.getByText('← Back to Menu')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('returns to main menu when back button is clicked from create room', () => {
      render(<RoomManager />);

      // Navigate to create room
      fireEvent.click(screen.getByText('Create a New Room'));
      expect(screen.getByTestId('create-room')).toBeInTheDocument();

      // Go back to menu
      fireEvent.click(screen.getByText('← Back to Menu'));
      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByText('Join Existing Room')).toBeInTheDocument();
      expect(screen.queryByTestId('create-room')).not.toBeInTheDocument();
    });

    it('returns to main menu when back button is clicked from join room', () => {
      render(<RoomManager />);

      // Navigate to join room
      fireEvent.click(screen.getByText('Join Existing Room'));
      expect(screen.getByTestId('join-room')).toBeInTheDocument();

      // Go back to menu
      fireEvent.click(screen.getByText('← Back to Menu'));
      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByText('Join Existing Room')).toBeInTheDocument();
      expect(screen.queryByTestId('join-room')).not.toBeInTheDocument();
    });
  });

  describe('Room State', () => {
    it('shows room lobby when user is in a room', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: { id: 'room123' },
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      render(<RoomManager />);

      expect(screen.getByTestId('room-lobby')).toBeInTheDocument();
    });

    it('shows room lobby when user has complete room data', () => {
      const completeRoom = {
        id: 'room123',
        name: 'Test Room',
        createdBy: 'user123',
        createdAt: Date.now(),
        status: 'waiting' as const,
        players: [],
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
        },
      };

      mockUseRoom.mockReturnValue({
        currentRoom: completeRoom,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      render(<RoomManager />);

      expect(screen.getByTestId('room-lobby')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders CreateRoom component when in create view', () => {
      render(<RoomManager />);

      fireEvent.click(screen.getByText('Create a New Room'));

      expect(screen.getByTestId('create-room')).toBeInTheDocument();
    });

    it('renders JoinRoom component when in join view', () => {
      render(<RoomManager />);

      fireEvent.click(screen.getByText('Join Existing Room'));

      expect(screen.getByTestId('join-room')).toBeInTheDocument();
    });

    it('renders RoomLobby component when user is in a room', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: { id: 'room123' },
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      render(<RoomManager />);

      expect(screen.getByTestId('room-lobby')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('transitions from create room to lobby when room is created', () => {
      // Start with no room
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      const { rerender } = render(<RoomManager />);

      // Navigate to create room
      fireEvent.click(screen.getByText('Create a New Room'));
      expect(screen.getByTestId('create-room')).toBeInTheDocument();

      // Simulate room being created
      mockUseRoom.mockReturnValue({
        currentRoom: { id: 'room123' },
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      rerender(<RoomManager />);

      expect(screen.getByTestId('room-lobby')).toBeInTheDocument();
      expect(screen.queryByTestId('create-room')).not.toBeInTheDocument();
    });

    it('transitions from join room to lobby when room is joined', () => {
      // Start with no room
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      const { rerender } = render(<RoomManager />);

      // Navigate to join room
      fireEvent.click(screen.getByText('Join Existing Room'));
      expect(screen.getByTestId('join-room')).toBeInTheDocument();

      // Simulate room being joined
      mockUseRoom.mockReturnValue({
        currentRoom: { id: 'room123' },
        isLoading: false,
        error: null,
        createRoom: jest.fn(),
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: jest.fn(),
      });

      rerender(<RoomManager />);

      expect(screen.getByTestId('room-lobby')).toBeInTheDocument();
      expect(screen.queryByTestId('join-room')).not.toBeInTheDocument();
    });
  });
});
