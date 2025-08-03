import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDisplay } from './UserDisplay';
import { useUser } from '@/contexts/UserContext';

// Mock the useUser hook
jest.mock('@/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('UserDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: no user
    mockUseUser.mockReturnValue({
      userId: null,
      displayName: null,
      setUser: jest.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('should not render when no user is signed in', () => {
      render(<UserDisplay />);
      
      expect(screen.queryByText('Playing as:')).not.toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should render when user is signed in', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      expect(screen.getByText('Playing as:')).toBeInTheDocument();
      expect(screen.getByText('Guest-abc123')).toBeInTheDocument();
      expect(screen.getByText('Share this ID:')).toBeInTheDocument();
      expect(screen.getByText('user123')).toBeInTheDocument();
    });

    it('should display the correct user information', () => {
      mockUseUser.mockReturnValue({
        userId: 'verylonguserid123456789',
        displayName: 'Guest-verylong',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      expect(screen.getByText('Guest-verylong')).toBeInTheDocument();
      expect(screen.getByText('verylonguserid123456789')).toBeInTheDocument();
    });
  });

  describe('Copy ID Functionality', () => {
    it('should copy user ID to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      navigator.clipboard.writeText = mockWriteText;

      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByText('Copy ID');
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('user123');
    });

    it('should handle clipboard API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
      navigator.clipboard.writeText = mockWriteText;
      
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByText('Copy ID');
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('user123');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should work with very long user IDs', async () => {
      const user = userEvent.setup();
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      const longUserId = 'a'.repeat(100);
      navigator.clipboard.writeText = mockWriteText;
      
      mockUseUser.mockReturnValue({
        userId: longUserId,
        displayName: 'Guest-aaaaaaaa',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByText('Copy ID');
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith(longUserId);
    });
  });

  describe('UI Elements', () => {
    it('should render all required UI elements when user is signed in', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      // Check that all important content is rendered
      expect(screen.getByText('Playing as:')).toBeInTheDocument();
      expect(screen.getByText('Guest-abc123')).toBeInTheDocument();
      expect(screen.getByText('Share this ID:')).toBeInTheDocument();
      expect(screen.getByText('user123')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy id/i })).toBeInTheDocument();
    });

    it('should display user ID in a readable format', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const userIdElement = screen.getByText('user123');
      expect(userIdElement).toBeInTheDocument();
      // Test that the ID is actually visible and readable
      expect(userIdElement.textContent).toBe('user123');
    });

    it('should have a functional copy button', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByRole('button', { name: /copy id/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toBeEnabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByRole('button', { name: /copy id/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      navigator.clipboard.writeText = mockWriteText;
      
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Guest-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      const copyButton = screen.getByText('Copy ID');
      copyButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockWriteText).toHaveBeenCalledWith('user123');
    });
  });
}); 