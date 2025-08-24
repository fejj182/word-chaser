import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
jest.mock('@/features/guest-auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, loading: false })
}));
import JoinRoom from '../JoinRoom';

const mockJoinRoom = jest.fn();
const mockClearError = jest.fn();
const mockCreateRoom = jest.fn();
const mockLeaveRoom = jest.fn();

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn(),
}));

import { useRoom } from '@/features/room-management/contexts/RoomContext';
const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('JoinRoom', () => {
  beforeEach(() => {
    mockJoinRoom.mockClear();
    mockClearError.mockClear();
    mockCreateRoom.mockClear();
    mockLeaveRoom.mockClear();
    
    mockUseRoom.mockReturnValue({
      joinRoom: mockJoinRoom,
      createRoom: mockCreateRoom,
      leaveRoom: mockLeaveRoom,
      clearError: mockClearError,
      currentRoom: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders join room form', () => {
    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    expect(screen.getByText(/join a room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
  });

  it('submits form with room code', async () => {
    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    const roomCodeInput = screen.getByLabelText(/room code/i);
    const aliasInput = screen.getByLabelText(/alias/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(aliasInput, { target: { value: 'Alias' } });
    fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Alias');
    });
  });

  it('disables submit button when room code is empty', () => {
    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    const submitButton = screen.getByRole('button', { name: /join room/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when room code is provided', () => {
    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    const aliasInput = screen.getByLabelText(/alias/i);
    const roomCodeInput = screen.getByLabelText(/room code/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(aliasInput, { target: { value: 'Alias' } });
    fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('trims whitespace from room code', async () => {
    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    const aliasInput = screen.getByLabelText(/alias/i);
    const roomCodeInput = screen.getByLabelText(/room code/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(aliasInput, { target: { value: 'Alias' } });
    fireEvent.change(roomCodeInput, { target: { value: '  ABC123  ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Alias');
    });
  });

  it('shows error message when error is present', () => {
    mockUseRoom.mockReturnValue({
      joinRoom: mockJoinRoom,
      createRoom: mockCreateRoom,
      leaveRoom: mockLeaveRoom,
      clearError: mockClearError,
      currentRoom: null,
      isLoading: false,
      error: 'Room not found',
    });

    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    expect(screen.getByText('Room not found')).toBeInTheDocument();
  });

  it('disables form fields when loading', () => {
    mockUseRoom.mockReturnValue({
      joinRoom: mockJoinRoom,
      createRoom: mockCreateRoom,
      leaveRoom: mockLeaveRoom,
      clearError: mockClearError,
      currentRoom: null,
      isLoading: true,
      error: null,
    });

    render(
      <UserProvider>
        <JoinRoom />
      </UserProvider>
    );

    const roomCodeInput = screen.getByLabelText(/room code/i);
    expect(roomCodeInput).toBeDisabled();
  });
});
