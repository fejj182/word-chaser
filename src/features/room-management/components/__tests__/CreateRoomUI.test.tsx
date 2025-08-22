import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateRoomUI from '../CreateRoomUI';

describe('CreateRoomUI', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form fields correctly', () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum players/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/round duration \(seconds\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of rounds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/room name/i), {
      target: { value: 'Test Room' },
    });
    fireEvent.change(screen.getByLabelText(/maximum players/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText(/round duration \(seconds\)/i), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText(/number of rounds/i), {
      target: { value: '5' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Room',
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
        },
      });
    });
  });

  it('disables submit button when loading', () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /create room/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to create room';
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display error message when error prop is null', () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} error={null} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('does not display error message when error prop is undefined', () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('prevents submission with empty room name', async () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    // Try to submit with empty room name
    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    // The form should not call onSubmit when room name is empty
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });


}); 
