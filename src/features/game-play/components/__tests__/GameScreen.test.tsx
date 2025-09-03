import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { GameScreen } from '../GameScreen';
import { User } from 'firebase/auth';

// Mock the contexts
jest.mock('@/features/room-management/contexts/RoomContext');
jest.mock('@/features/guest-auth/hooks/useAuth');

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseRoom = useRoom as jest.MockedFunction<typeof useRoom>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('GameScreen', () => {
  const mockLeaveRoom = jest.fn();
  const mockUser = {
    uid: 'user123',
    displayName: 'Test Player',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
  } as User;
  
  const mockRoom = {
    id: 'room123',
    name: 'TEST123',
    slug: 'TEST123',
    createdBy: 'user123',
    createdAt: Date.now(),
    status: 'playing' as const,
    players: [
      { id: 'user123', displayName: 'Test Player', joinedAt: Date.now(), isHost: false, isReady: true }
    ],
    maxPlayers: 4,
    settings: { roundDuration: 60, maxRounds: 5 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders game screen when room is in playing status', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: mockRoom,
      leaveRoom: mockLeaveRoom,
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      roomId: 'room123',
      clearError: jest.fn(),
    });
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<GameScreen roomId="room123" />);

    expect(screen.getByText('Word Chaser')).toBeInTheDocument();
    expect(screen.getByText(/Room:/)).toBeInTheDocument();
    expect(screen.getByText('TEST123')).toBeInTheDocument();
    expect(screen.getByText(/Playing as:/)).toBeInTheDocument();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave game' })).toBeInTheDocument();
  });

  it('redirects to home when room is not in playing status', () => {
    const waitingRoom = { ...mockRoom, status: 'waiting' as const };
    
    mockUseRoom.mockReturnValue({
      currentRoom: waitingRoom,
      leaveRoom: mockLeaveRoom,
      loadRoom: jest.fn(),
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
      roomId: 'room123',
    });
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(<GameScreen roomId="room123" />);
    
    // The component should render initially, then redirect
    expect(screen.getByText('Word Chaser')).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('does not render when no room or user', () => {
    mockUseRoom.mockReturnValue({
      currentRoom: null,
      leaveRoom: mockLeaveRoom,
      isLoading: false,
      error: null,
      createRoom: jest.fn(),
      loadRoom: jest.fn(),
      joinRoom: jest.fn(),
      updatePlayerReady: jest.fn(),
      startGame: jest.fn(),
      clearError: jest.fn(),
      roomId: 'room123',
    });
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    const { container } = render(<GameScreen roomId="room123" />);
    expect(container.firstChild).toBeNull();
  });
});
