import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
jest.mock('@/features/guest-auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, loading: false })
}));
import CreateRoom from '../CreateRoom';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn(),
}));

jest.mock('../CreateRoomUI', () => {
  return function MockCreateRoomUI({ onSubmit, isLoading, error }: any) {
    return (
      <div data-testid="create-room-form">
        <button onClick={() => onSubmit({ name: 'Test Room', maxPlayers: 4, settings: { roundDuration: 60, maxRounds: 5 } }, 'Alias') }>
          Submit Form
        </button>
        <span data-testid="loading-state">{isLoading.toString()}</span>
        {error && <div data-testid="error-message">{error}</div>}
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
      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByTestId('create-room-form')).toBeInTheDocument();
    });
  });

  describe('Room Creation Flow', () => {
    it('should call createRoom when form is submitted', async () => {
      mockCreateRoom.mockResolvedValue('room123');

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      fireEvent.click(screen.getByText('Submit Form'));

      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledWith({
          name: 'Test Room',
          maxPlayers: 4,
          settings: { roundDuration: 60, maxRounds: 5 }
        }, 'Alias');
      });
    });

    it('should clear error before creating room', async () => {
      mockCreateRoom.mockResolvedValue('room123');

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

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

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create room');
    });

    it('should handle createRoom throwing an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateRoom.mockRejectedValue(new Error('Network error'));

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

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

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate with CreateRoomUI component', () => {
      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      expect(screen.getByTestId('create-room-form')).toBeInTheDocument();
    });
  });

});
