import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreDisplay } from '../ScoreDisplay';

// Mock the RoomContext
jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  useRoom: jest.fn()
}));

// Mock the useAuth hook
jest.mock('@/features/user-management/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const mockUseRoom = require('@/features/room-management/contexts/RoomContext').useRoom;
const mockUseAuth = require('@/features/user-management/hooks/useAuth').useAuth;

describe('ScoreDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays score and words found from current player', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room-id',
        players: {
          'test-user-id': {
            displayName: 'Test User',
            score: 150,
            wordsFound: 5
          }
        }
      }
    });

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'test-user-id',
        displayName: 'Test User'
      }
    });

    render(<ScoreDisplay />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('5 words')).toBeInTheDocument();
    expect(screen.getByText('Your Score:')).toBeInTheDocument();
  });

  it('displays zero values when player not found', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room-id',
        players: {}
      }
    });

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'test-user-id',
        displayName: 'Test User'
      }
    });

    render(<ScoreDisplay />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('Your Score:')).toBeInTheDocument();
  });

  it('displays zero values when no user is logged in', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: {
        id: 'test-room-id',
        players: {
          'other-user-id': {
            displayName: 'Other User',
            score: 100,
            wordsFound: 3
          }
        }
      }
    });

    mockUseAuth.mockReturnValue({
      user: null
    });

    render(<ScoreDisplay />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('Your Score:')).toBeInTheDocument();
  });

  it('displays zero values when no room is available', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null
    });

    mockUseAuth.mockReturnValue({
      user: {
        uid: 'test-user-id',
        displayName: 'Test User'
      }
    });

    render(<ScoreDisplay />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('Your Score:')).toBeInTheDocument();
  });
});
