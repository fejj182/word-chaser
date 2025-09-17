import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WordInput } from '../WordInput';
import { GamePlayProvider } from '../../contexts/GamePlayContext';

// Mock the useWordSubmission hook
jest.mock('../../hooks/useWordSubmission', () => ({
  useWordSubmission: jest.fn()
}));

// Mock the useWordPath hook
jest.mock('../../hooks/useWordPath', () => ({
  useWordPath: jest.fn()
}));

// Mock the GamePlayContext
jest.mock('../../contexts/GamePlayContext', () => ({
  useGamePlay: jest.fn(),
  GamePlayProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock the RoomContext
jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn()
}));

// Mock the useAuth hook
jest.mock('@/features/user-management/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the useSubmittedWords hook
jest.mock('../../hooks/useSubmittedWords', () => ({
  useSubmittedWords: jest.fn()
}));

const mockUseWordSubmission = require('../../hooks/useWordSubmission').useWordSubmission;
const mockUseWordPath = require('../../hooks/useWordPath').useWordPath;
const mockUseGamePlay = require('../../contexts/GamePlayContext').useGamePlay;
const mockUseRoom = require('@/features/room-management/contexts/RoomContext').useRoom;
const mockUseAuth = require('@/features/user-management/hooks/useAuth').useAuth;
const mockUseSubmittedWords = require('../../hooks/useSubmittedWords').useSubmittedWords;

// Mock board letters for testing
const mockBoardLetters = [
  ['A', 'B', 'C'],
  ['D', 'E', 'F'],
  ['G', 'H', 'I']
];

describe('WordInput', () => {
  const mockSubmitWord = jest.fn();
  const mockClearError = jest.fn();
  const mockClearSubmission = jest.fn();
  const mockSetCurrentWord = jest.fn();
  const mockSelectTilesForWord = jest.fn();
  const mockClearSelection = jest.fn();

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

    mockUseWordPath.mockReturnValue({
      currentWord: '',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: false
    });

    mockUseGamePlay.mockReturnValue({
      state: {
        grid: mockBoardLetters
      }
    });

    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room-id',
        name: 'Test Room',
        status: 'playing'
      }
    });

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'test-user-id',
        displayName: 'Test User'
      }
    });

    mockUseSubmittedWords.mockReturnValue({
      submittedWords: [],
      isWordSubmitted: jest.fn().mockReturnValue(false)
    });
  });

  it('renders word input form', () => {
    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    expect(screen.getByText('Submit Words')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Word')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('disables submit button when word is too short', () => {
    mockUseWordPath.mockReturnValue({
      currentWord: '',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: false
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit Word' });
    const input = screen.getByLabelText('Current Word');

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(submitButton).toBeDisabled();

    mockUseWordPath.mockReturnValue({
      currentWord: 'ABC',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: true
    });

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits word and clears input', async () => {
    mockSubmitWord.mockResolvedValue({
      success: true,
      result: { isValid: true, score: 30 }
    });

    mockUseWordPath.mockReturnValue({
      currentWord: 'TEST',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: true
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitWord).toHaveBeenCalledWith('TEST', mockBoardLetters, 'test-room-id', 'test-user-id');
    });

    // The input should be cleared after successful submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('clears input when clear button is clicked', () => {
    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const input = screen.getByLabelText('Current Word');
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('TEST');

    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows submitted words list', () => {
    const mockSubmittedWords = [
      {
        word: 'FIRST',
        playerId: 'player1',
        playerName: 'Player One',
        score: 30,
        submittedAt: Date.now() - 1000
      },
      {
        word: 'SECOND',
        playerId: 'player2',
        playerName: 'Player Two',
        score: 25,
        submittedAt: Date.now()
      }
    ];

    mockUseSubmittedWords.mockReturnValue({
      submittedWords: mockSubmittedWords,
      isWordSubmitted: jest.fn().mockReturnValue(false)
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    expect(screen.getByText('FIRST')).toBeInTheDocument();
    expect(screen.getByText('SECOND')).toBeInTheDocument();
    expect(screen.getByText('Score: 30 points')).toBeInTheDocument();
    expect(screen.getByText('Score: 25 points')).toBeInTheDocument();
    expect(screen.getByText('by Player One')).toBeInTheDocument();
    expect(screen.getByText('by Player Two')).toBeInTheDocument();
  });

  it('prevents submission of already submitted words', () => {
    const mockIsWordSubmitted = jest.fn().mockReturnValue(true);
    
    mockUseSubmittedWords.mockReturnValue({
      submittedWords: [],
      isWordSubmitted: mockIsWordSubmitted
    });

    mockUseWordPath.mockReturnValue({
      currentWord: 'ALREADY',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: true
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    expect(input).toHaveValue('ALREADY');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Word has already been submitted')).toBeInTheDocument();
  });

  it('handles form submission with enter key', async () => {
    mockSubmitWord.mockResolvedValue({
      success: true,
      result: { isValid: true, score: 30 }
    });

    mockUseWordPath.mockReturnValue({
      currentWord: 'TEST',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: true
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const input = screen.getByLabelText('Current Word');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockSubmitWord).toHaveBeenCalledWith('TEST', mockBoardLetters, 'test-room-id', 'test-user-id');
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

    mockUseWordPath.mockReturnValue({
      currentWord: '',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: false
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

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

    mockUseWordPath.mockReturnValue({
      currentWord: '',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: false
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear error' })).toBeInTheDocument();
  });

  it('shows invalid state when typing word that cannot be formed on grid', () => {
    mockUseWordSubmission.mockReturnValue({
      submitWord: mockSubmitWord,
      isLoading: false,
      error: null,
      lastSubmission: null,
      clearError: mockClearError,
      clearSubmission: mockClearSubmission
    });

    // Mock that "zzz" cannot be formed on the grid
    mockUseWordPath.mockReturnValue({
      currentWord: 'zzz',
      setCurrentWord: mockSetCurrentWord,
      selectTilesForWord: mockSelectTilesForWord,
      clearSelection: mockClearSelection,
      isValidPath: false // This should be false when word cannot be formed
    });

    render(
    <GamePlayProvider>
      <WordInput/>
    </GamePlayProvider>
    );

    const input = screen.getByLabelText('Current Word');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('bg-red-50');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
