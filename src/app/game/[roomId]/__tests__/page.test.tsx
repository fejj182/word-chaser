import React from 'react';
import { render, screen } from '@testing-library/react';
import GamePage from '../page';

jest.mock('@/features/game-play/components/GameScreen', () => ({
  GameScreen: () => <div data-testid="game-screen">Game Screen Component</div>,
}));

// Mock the contexts
jest.mock('@/features/session-management/contexts/SessionContext', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/features/room-management/contexts/RoomContext', () => ({
  RoomProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/features/guest-auth/contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('GamePage', () => {
  it('renders the game screen component', async () => {
    const params = { roomId: 'test-room-123' };
    
    render(GamePage({ params }));
    
    expect(screen.getByTestId('game-screen')).toBeInTheDocument();
    expect(screen.getByText('Game Screen Component')).toBeInTheDocument();
  });
});
