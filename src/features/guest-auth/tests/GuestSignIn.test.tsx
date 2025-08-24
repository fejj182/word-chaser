import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestSignIn } from '../components/GuestSignIn';
import { signInAsGuest } from '@/lib/firebase/firebase-utils';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { useUser } from '@/features/guest-auth/contexts/UserContext';

jest.mock('@/features/guest-auth/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/lib/firebase/firebase-utils', () => ({
  signInAsGuest: jest.fn(),
}));

jest.mock('@/features/guest-auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockSignInAsGuest = signInAsGuest as jest.MockedFunction<typeof signInAsGuest>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('GuestSignIn Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseUser.mockReturnValue({
      userId: null,
      displayName: null,
      setUser: jest.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('renders "Play as Guest" button when user is not signed in', () => {
      render(<GuestSignIn />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
    });

    it('only renders sign-in button regardless of auth state in this component', () => {
      mockUseAuth.mockReturnValue({ 
        user: { uid: 'test-uid' } as any, 
        loading: false 
      });
      mockUseUser.mockReturnValue({
        userId: 'test-uid',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<GuestSignIn />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
    });
  });

  describe('Guest Sign-In Flow', () => {
    it('calls signInAsGuest when "Play as Guest" button is clicked', async () => {
      const user = userEvent.setup();
      mockSignInAsGuest.mockResolvedValue({ 
        user: { uid: 'guest-uid' } as any, 
        error: null 
      });
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(mockSignInAsGuest).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during sign-in process', async () => {
      const user = userEvent.setup();
      mockSignInAsGuest.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ user: { uid: 'guest-uid' } as any, error: null }), 100)
        )
      );
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(button).toBeDisabled();
    });

    it('handles successful sign-in', async () => {
      const user = userEvent.setup();
      const mockUser = { uid: 'guest-uid', isAnonymous: true } as any;
      mockSignInAsGuest.mockResolvedValue({ user: mockUser, error: null });
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(mockSignInAsGuest).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when sign-in fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error occurred';
      mockSignInAsGuest.mockResolvedValue({ 
        user: null, 
        error: new Error(errorMessage) 
      });
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Suppress console.error for this test
      
      mockSignInAsGuest.mockRejectedValue(new Error('Unexpected error'));
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Unexpected error')).toBeInTheDocument();
      });
      
      // Restore console.error
      console.error = originalConsoleError;
    });

    it('clears previous error when retrying sign-in', async () => {
      const user = userEvent.setup();
      
      mockSignInAsGuest.mockResolvedValueOnce({ 
        user: null, 
        error: new Error('First error') 
      });
      
      mockSignInAsGuest.mockResolvedValueOnce({ 
        user: { uid: 'guest-uid' } as any, 
        error: null 
      });
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real Component Integration', () => {
    it('renders the guest sign-in interface', () => {
      render(<GuestSignIn />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
    });

    it('maintains consistent UI regardless of auth state', () => {
      mockUseAuth.mockReturnValue({ 
        user: { uid: 'test-uid' } as any, 
        loading: false 
      });
      mockUseUser.mockReturnValue({
        userId: 'test-uid',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<GuestSignIn />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
    });

    it('handles loading state correctly', async () => {
      const user = userEvent.setup();
      mockSignInAsGuest.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ user: { uid: 'guest-uid' } as any, error: null }), 100)
        )
      );
      
      render(<GuestSignIn />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(button).toBeDisabled();
    });
  });
});
