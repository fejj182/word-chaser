import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WordInput } from '../WordInput';

// Mock the useWordSubmission hook
jest.mock('../../hooks/useWordSubmission', () => ({
  useWordSubmission: jest.fn()
}));

const mockUseWordSubmission = require('../../hooks/useWordSubmission').useWordSubmission;

describe('WordInput', () => {
  const mockBoardLetters = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H']
  ];

  const mockSubmitWord = jest.fn();
  const mockClearError = jest.fn();
  const mockClearSubmission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWordSubmission.mockReturnValue({
      submitWord: mockSubmitWord,
      isLoading: false,
      error: null,
      lastSubmission: null,
      clearError: mockClearError,
      clearSubmission: mockClearSubmission
    });
  });

  it('renders word input form', () => {
    render(<WordInput boardLetters={mockBoardLetters} />);

    expect(screen.getByText('Submit Words')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Word')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('disables submit button when word is too short', () => {
    render(<WordInput boardLetters={mockBoardLetters} />);

    const submitButton = screen.getByRole('button', { name: 'Submit Word' });
    const input = screen.getByLabelText('Current Word');

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits word and clears input', async () => {
    mockSubmitWord.mockResolvedValue({
      success: true,
      result: { isValid: true, score: 30 }
    });

    render(<WordInput boardLetters={mockBoardLetters} />);

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitWord).toHaveBeenCalledWith('test', mockBoardLetters);
    });

    // The input should be cleared after successful submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('clears input when clear button is clicked', () => {
    render(<WordInput boardLetters={mockBoardLetters} />);

    const input = screen.getByLabelText('Current Word');
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');

    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows submitted words list', async () => {
    mockSubmitWord.mockResolvedValue({
      success: true,
      result: { isValid: true, score: 30 }
    });

    render(<WordInput boardLetters={mockBoardLetters} />);

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    // Submit first word
    fireEvent.change(input, { target: { value: 'first' } });
    fireEvent.click(submitButton);

    // Submit second word
    fireEvent.change(input, { target: { value: 'second' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('FIRST')).toBeInTheDocument();
      expect(screen.getByText('SECOND')).toBeInTheDocument();
    });
  });

  it('handles form submission with enter key', async () => {
    mockSubmitWord.mockResolvedValue({
      success: true,
      result: { isValid: true, score: 30 }
    });

    render(<WordInput boardLetters={mockBoardLetters} />);

    const input = screen.getByLabelText('Current Word');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockSubmitWord).toHaveBeenCalledWith('test', mockBoardLetters);
    });

    // The input should be cleared after successful submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows loading state when submitting', () => {
    mockUseWordSubmission.mockReturnValue({
      submitWord: mockSubmitWord,
      isLoading: true,
      error: null,
      lastSubmission: null,
      clearError: mockClearError,
      clearSubmission: mockClearSubmission
    });

    render(<WordInput boardLetters={mockBoardLetters} />);

    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current Word')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('shows error message when there is an error', () => {
    mockUseWordSubmission.mockReturnValue({
      submitWord: mockSubmitWord,
      isLoading: false,
      error: 'Network error',
      lastSubmission: null,
      clearError: mockClearError,
      clearSubmission: mockClearSubmission
    });

    render(<WordInput boardLetters={mockBoardLetters} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear error' })).toBeInTheDocument();
  });

  it('calls onWordSubmitted callback when word is submitted', async () => {
    const mockOnWordSubmitted = jest.fn();
    const mockResult = {
      success: true,
      result: { isValid: true, score: 30 }
    };

    mockSubmitWord.mockResolvedValue(mockResult);

    render(
      <WordInput 
        boardLetters={mockBoardLetters} 
        onWordSubmitted={mockOnWordSubmitted}
      />
    );

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnWordSubmitted).toHaveBeenCalledWith(mockResult);
    });
  });
});
