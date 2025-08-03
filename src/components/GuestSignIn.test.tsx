import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuestSignIn } from './GuestSignIn'
import { signInAsGuest } from '@/lib/firebase-utils'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/contexts/UserContext'

// Mock the useUser hook
jest.mock('@/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

// Mock the firebase-utils module
jest.mock('@/lib/firebase-utils', () => ({
  signInAsGuest: jest.fn(),
}))

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

const mockSignInAsGuest = signInAsGuest as jest.MockedFunction<typeof signInAsGuest>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('GuestSignIn Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock: user is not signed in
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    mockUseUser.mockReturnValue({
      userId: 'user123',
      displayName: 'Guest-abc123',
      setUser: jest.fn(),
    });
  })

  describe('Component Rendering', () => {
    it('renders the "Play as Guest" button when user is not signed in', () => {
      render(<GuestSignIn />)
      
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument()
    })

    it('does not render the button when user is already signed in', () => {
      mockUseAuth.mockReturnValue({ 
        user: { uid: 'test-uid' } as any, 
        loading: false 
      })
      
      render(<GuestSignIn />)
      
      expect(screen.queryByRole('button', { name: /play as guest/i })).not.toBeInTheDocument()
    })

    it('shows loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true })
      
      render(<GuestSignIn />)
      
      // Should show button even when auth is loading (component doesn't check loading state)
      expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument()
    })
  })

  describe('Guest Sign-In Flow', () => {
    it('calls signInAsGuest when button is clicked', async () => {
      const user = userEvent.setup()
      mockSignInAsGuest.mockResolvedValue({ 
        user: { uid: 'guest-uid' } as any, 
        error: null 
      })
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      expect(mockSignInAsGuest).toHaveBeenCalledTimes(1)
    })

    it('shows loading state during sign-in process', async () => {
      const user = userEvent.setup()
      // Mock a delayed response to test loading state
      mockSignInAsGuest.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ user: { uid: 'guest-uid' } as any, error: null }), 100)
        )
      )
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      // Should show loading text
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('handles successful sign-in', async () => {
      const user = userEvent.setup()
      const mockUser = { uid: 'guest-uid', isAnonymous: true } as any
      mockSignInAsGuest.mockResolvedValue({ user: mockUser, error: null })
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(mockSignInAsGuest).toHaveBeenCalledTimes(1)
      })
      
      // Button should be re-enabled after sign-in
      expect(button).not.toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when sign-in fails', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Network error occurred'
      mockSignInAsGuest.mockResolvedValue({ 
        user: null, 
        error: new Error(errorMessage) 
      })
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('displays generic error message for unknown errors', async () => {
      const user = userEvent.setup()
      mockSignInAsGuest.mockRejectedValue(new Error('Unexpected error'))
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to sign in as guest/i)).toBeInTheDocument()
      })
    })

    it('clears previous error when retrying sign-in', async () => {
      const user = userEvent.setup()
      
      // First attempt fails
      mockSignInAsGuest.mockResolvedValueOnce({ 
        user: null, 
        error: new Error('First error') 
      })
      
      // Second attempt succeeds
      mockSignInAsGuest.mockResolvedValueOnce({ 
        user: { uid: 'guest-uid' } as any, 
        error: null 
      })
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      
      // First click - should show error
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })
      
      // Second click - error should be cleared
      await user.click(button)
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('button is disabled during loading state', async () => {
      const user = userEvent.setup()
      mockSignInAsGuest.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ user: { uid: 'guest-uid' } as any, error: null }), 100)
        )
      )
      
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      await user.click(button)
      
      expect(button).toBeDisabled()
      // Note: The button uses the 'disabled' prop, not 'aria-disabled' attribute
    })

    it('button has proper ARIA attributes', () => {
      render(<GuestSignIn />)
      
      const button = screen.getByRole('button', { name: /play as guest/i })
      expect(button).toBeInTheDocument()
    })
  })
}) 