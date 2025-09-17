import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success toast with correct message and icon', () => {
    render(
      <Toast
        message="Success message"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error toast with correct message and icon', () => {
    render(
      <Toast
        message="Error message"
        type="error"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('renders info toast with correct message and icon', () => {
    render(
      <Toast
        message="Info message"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    render(
      <Toast
        message="Hidden message"
        type="info"
        isVisible={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Hidden message')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Toast
        message="Test message"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after default duration', async () => {
    jest.useFakeTimers();
    
    render(
      <Toast
        message="Auto close message"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Auto close message')).toBeInTheDocument();

    // Fast-forward time by 4 seconds (default duration)
    jest.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('auto-closes after custom duration', async () => {
    jest.useFakeTimers();
    
    render(
      <Toast
        message="Custom duration message"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
        duration={2000}
      />
    );

    expect(screen.getByText('Custom duration message')).toBeInTheDocument();

    // Fast-forward time by 2 seconds (custom duration)
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('clears timer when component unmounts', () => {
    jest.useFakeTimers();
    
    const { unmount } = render(
      <Toast
        message="Unmount test"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    unmount();

    // Fast-forward time to ensure timer was cleared
    jest.advanceTimersByTime(4000);

    expect(mockOnClose).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
