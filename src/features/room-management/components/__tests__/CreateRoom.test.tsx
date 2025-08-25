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
      expect(screen.getByLabelText('Alias')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Players')).toBeInTheDocument();
      expect(screen.getByText('Create Room')).toBeInTheDocument();
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

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByText('Create Room'));

      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledWith({
          maxPlayers: 4,
          settings: { roundDuration: 60, maxRounds: 5 }
        }, 'Test User');
      });
    });

    it('should clear error before creating room', async () => {
      mockCreateRoom.mockResolvedValue('room123');

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByText('Create Room'));

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

      expect(screen.getByText('Failed to create room')).toBeInTheDocument();
    });

    it('should handle createRoom throwing an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateRoom.mockRejectedValue(new Error('Network error'));

      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Alias'), { target: { value: 'Test User' } });
      
      // Submit the form
      fireEvent.click(screen.getByText('Create Room'));

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

      // Check that form elements are disabled when loading
      expect(screen.getByLabelText('Alias')).toBeDisabled();
      expect(screen.getByLabelText('Maximum Players')).toBeDisabled();
      expect(screen.getByText('Create Room')).toBeDisabled();
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate with CreateRoomUI component', () => {
      render(
        <UserProvider>
          <CreateRoom />
        </UserProvider>
      );

      // Check that the real CreateRoomUI component is rendered with all its elements
      expect(screen.getByText('Create a New Room')).toBeInTheDocument();
      expect(screen.getByLabelText('Alias')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Players')).toBeInTheDocument();
      expect(screen.getByText('Game Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Round Duration (seconds)')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Rounds')).toBeInTheDocument();
      expect(screen.getByText('Create Room')).toBeInTheDocument();
    });
  });

});
