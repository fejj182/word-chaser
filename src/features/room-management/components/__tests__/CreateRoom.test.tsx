import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateRoom from '../CreateRoom';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

// Mock the room context
jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn(),
}));

// Mock child components
jest.mock('../CreateRoomForm', () => {
  return function MockCreateRoomForm({ onSubmit, isLoading }: any) {
    return (
      <div data-testid="create-room-form">
        <button onClick={() => onSubmit({ name: 'Test Room', maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } })}>
          Submit Form
        </button>
        <span data-testid="loading-state">{isLoading.toString()}</span>
      </div>
    );
  };
});

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('CreateRoom', () => {
  const mockCreateRoom = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoom.mockReturnValue({
      currentRoom: null,
      isLoading: false,
      error: null,
      createRoom: mockCreateRoom,
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      clearError: mockClearError,
    });
  });

  describe('Initial State', () => {
    it('should show create room form initially', () => {
      render(<CreateRoom />);

      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByTestId('create-room-form')).toBeInTheDocument();
    });
  });

  describe('Room Creation Flow', () => {
    it('should call createRoom when form is submitted', async () => {
      mockCreateRoom.mockResolvedValue('room123');

      render(<CreateRoom />);

      fireEvent.click(screen.getByText('Submit Form'));

      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledWith({
          name: 'Test Room',
          maxPlayers: 4,
          settings: { roundDuration: 60, maxRounds: 5 }
        });
      });
    });

    it('should clear error before creating room', async () => {
      mockCreateRoom.mockResolvedValue('room123');

      render(<CreateRoom />);

      fireEvent.click(screen.getByText('Submit Form'));

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when room creation fails', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        isLoading: false,
        error: 'Failed to create room',
        createRoom: mockCreateRoom,
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: mockClearError,
      });

      render(<CreateRoom />);

      expect(screen.getByText('Failed to create room')).toBeInTheDocument();
    });

    it('should handle createRoom throwing an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateRoom.mockRejectedValue(new Error('Network error'));

      render(<CreateRoom />);

      fireEvent.click(screen.getByText('Submit Form'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create room:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should pass loading state to form component', () => {
      mockUseRoom.mockReturnValue({
        currentRoom: null,
        isLoading: true,
        error: null,
        createRoom: mockCreateRoom,
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        clearError: mockClearError,
      });

      render(<CreateRoom />);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate with CreateRoomForm component', () => {
      render(<CreateRoom />);

      expect(screen.getByTestId('create-room-form')).toBeInTheDocument();
    });
  });

});
