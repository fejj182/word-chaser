import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestSignInUI } from '../components/GuestSignInUI';

describe('GuestSignInUI', () => {
  const mockOnSignIn = jest.fn();
  const mockOnStartGame = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default State (Not Signed In)', () => {
    it('renders the "Play as Guest" button', () => {
      render(<GuestSignInUI />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
    });

    it('calls onSignIn when button is clicked', async () => {
      const user = userEvent.setup();
      render(<GuestSignInUI onSignIn={mockOnSignIn} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });

    it('does not call onSignIn when isLoading is true', async () => {
      const user = userEvent.setup();
      render(<GuestSignInUI onSignIn={mockOnSignIn} isLoading={true} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(mockOnSignIn).not.toHaveBeenCalled();
    });

    it('does not call onSignIn when onSignIn is not provided', async () => {
      const user = userEvent.setup();
      render(<GuestSignInUI />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      // Should not throw error, just not call anything
      expect(button).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables button when isLoading is true', () => {
      render(<GuestSignInUI isLoading={true} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      expect(button).toBeDisabled();
    });

    it('prevents onSignIn call when loading', async () => {
      const user = userEvent.setup();
      render(<GuestSignInUI onSignIn={mockOnSignIn} isLoading={true} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      await user.click(button);
      
      expect(mockOnSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('displays error message when error is provided', () => {
      const errorMessage = 'Network error occurred';
      render(<GuestSignInUI error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error when error is null', () => {
      render(<GuestSignInUI error={null} />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('does not display error when error is empty string', () => {
      render(<GuestSignInUI error="" />);
      
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Signed In State', () => {
    it('shows welcome message and display name when signed in', () => {
      const displayName = 'Guest-abc12345';
      render(<GuestSignInUI isSignedIn={true} displayName={displayName} />);
      
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText(displayName)).toBeInTheDocument();
    });

    it('shows "Start Game" button when signed in', () => {
      render(<GuestSignInUI isSignedIn={true} displayName="Guest-abc12345" />);
      
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
    });

    it('calls onStartGame when "Start Game" button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <GuestSignInUI 
          isSignedIn={true} 
          displayName="Guest-abc12345" 
          onStartGame={mockOnStartGame} 
        />
      );
      
      const button = screen.getByRole('button', { name: /start game/i });
      await user.click(button);
      
      expect(mockOnStartGame).toHaveBeenCalledTimes(1);
    });

    it('does not call onStartGame when onStartGame is not provided', async () => {
      const user = userEvent.setup();
      render(
        <GuestSignInUI 
          isSignedIn={true} 
          displayName="Guest-abc12345" 
        />
      );
      
      const button = screen.getByRole('button', { name: /start game/i });
      await user.click(button);
      
      // Should not throw error, just not call anything
      expect(button).toBeInTheDocument();
    });

    it('does not show signed in state when displayName is missing', () => {
      render(<GuestSignInUI isSignedIn={true} displayName={null} />);
      
      // Should show sign-in button instead
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
      expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty displayName string', () => {
      render(<GuestSignInUI isSignedIn={true} displayName="" />);
      
      // Should show sign-in button instead
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
      expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });

    it('handles all props being undefined', () => {
      render(<GuestSignInUI />);
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
      expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<GuestSignInUI onSignIn={mockOnSignIn} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      button.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });

    it('button has proper disabled state', () => {
      render(<GuestSignInUI isLoading={true} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      expect(button).toBeDisabled();
    });

    it('button has proper enabled state', () => {
      render(<GuestSignInUI isLoading={false} />);
      
      const button = screen.getByRole('button', { name: /play as guest/i });
      expect(button).not.toBeDisabled();
    });
  });
});
