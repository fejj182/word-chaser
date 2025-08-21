import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JoinRoom from '../JoinRoom';

const mockJoinRoom = jest.fn();
const mockClearError = jest.fn();
const mockCreateRoom = jest.fn();
const mockLeaveRoom = jest.fn();

// Mock the useRoom hook at the top level
jest.mock('@/features/shared/contexts/RoomContext', () => ({
  useRoom: jest.fn(),
}));

// Import the mocked hook
import { useRoom } from '@/features/shared/contexts/RoomContext';
const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;

describe('JoinRoom', () => {
  beforeEach(() => {
    mockJoinRoom.mockClear();
    mockClearError.mockClear();
    mockCreateRoom.mockClear();
    mockLeaveRoom.mockClear();
    
    // Set up default mock return value
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
    render(<JoinRoom />);

    expect(screen.getByText(/join a room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
  });

  it('submits form with room code', async () => {
    render(<JoinRoom />);

    const roomCodeInput = screen.getByLabelText(/room code/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123');
    });
  });

  it('disables submit button when room code is empty', () => {
    render(<JoinRoom />);

    const submitButton = screen.getByRole('button', { name: /join room/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when room code is provided', () => {
    render(<JoinRoom />);

    const roomCodeInput = screen.getByLabelText(/room code/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('trims whitespace from room code', async () => {
    render(<JoinRoom />);

    const roomCodeInput = screen.getByLabelText(/room code/i);
    const submitButton = screen.getByRole('button', { name: /join room/i });

    fireEvent.change(roomCodeInput, { target: { value: '  ABC123  ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123');
    });
  });

  it('shows error message when error is present', () => {
    // Update the mock to return an error
    mockUseRoom.mockReturnValue({
      joinRoom: mockJoinRoom,
      createRoom: mockCreateRoom,
      leaveRoom: mockLeaveRoom,
      clearError: mockClearError,
      currentRoom: null,
      isLoading: false,
      error: 'Room not found',
    });

    render(<JoinRoom />);

    expect(screen.getByText('Room not found')).toBeInTheDocument();
  });

  it('disables form fields when loading', () => {
    // Update the mock to return loading state
    mockUseRoom.mockReturnValue({
      joinRoom: mockJoinRoom,
      createRoom: mockCreateRoom,
      leaveRoom: mockLeaveRoom,
      clearError: mockClearError,
      currentRoom: null,
      isLoading: true,
      error: null,
    });

    render(<JoinRoom />);

    const roomCodeInput = screen.getByLabelText(/room code/i);
    expect(roomCodeInput).toBeDisabled();
  });
});
