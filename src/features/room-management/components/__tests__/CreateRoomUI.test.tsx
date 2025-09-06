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

    expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum players/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /grid size/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/round duration \(seconds\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of rounds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/alias/i), {
      target: { value: 'Tester' },
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

    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          maxPlayers: 4,
          settings: {
            roundDuration: 60,
            maxRounds: 5,
            gridSize: 'medium',
          },
        },
        'Tester'
      );
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

    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('allows changing grid size selection', () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    // Default should be medium (6×6)
    expect(screen.getByText('6×6').closest('button')).toHaveClass('border-blue-500');

    // Click on small (4×4)
    fireEvent.click(screen.getByText('4×4').closest('button')!);
    expect(screen.getByText('4×4').closest('button')).toHaveClass('border-blue-500');
    expect(screen.getByText('6×6').closest('button')).not.toHaveClass('border-blue-500');

    // Click on large (8×8)
    fireEvent.click(screen.getByText('8×8').closest('button')!);
    expect(screen.getByText('8×8').closest('button')).toHaveClass('border-blue-500');
    expect(screen.getByText('4×4').closest('button')).not.toHaveClass('border-blue-500');
  });

  it('submits form with selected grid size', async () => {
    render(<CreateRoomUI onSubmit={mockOnSubmit} isLoading={false} />);

    // Change grid size to small
    fireEvent.click(screen.getByText('4×4').closest('button')!);
    
    fireEvent.change(screen.getByLabelText(/alias/i), {
      target: { value: 'Tester' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          maxPlayers: 4,
          settings: {
            roundDuration: 60,
            maxRounds: 5,
            gridSize: 'small',
          },
        },
        'Tester'
      );
    });
  });

}); 
