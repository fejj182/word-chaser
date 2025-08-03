import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from './UserContext';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test component to access context
const TestComponent = () => {
  const { userId, displayName, setUser } = useUser();
  return (
    <div>
      <div data-testid="userId">{userId || 'no-user'}</div>
      <div data-testid="displayName">{displayName || 'no-display'}</div>
      <button 
        data-testid="setUser"
        onClick={() => setUser({ uid: 'test-uid', isAnonymous: true } as any)}
      >
        Set User
      </button>
      <button 
        data-testid="clearUser"
        onClick={() => setUser(null)}
      >
        Clear User
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <UserProvider>
      {component}
    </UserProvider>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: no user
    mockUseAuth.mockReturnValue({ user: null, loading: false });
  });

  describe('Initial State', () => {
    it('should initialize with null user values', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
      expect(screen.getByTestId('displayName')).toHaveTextContent('no-display');
    });

    it('should handle loading state from useAuth', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });
      
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
      expect(screen.getByTestId('displayName')).toHaveTextContent('no-display');
    });
  });

  describe('Anonymous User Handling', () => {
    it('should generate display name for anonymous users', async () => {
      const mockUser = {
        uid: 'abc123def456',
        isAnonymous: true,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('abc123def456');
        expect(screen.getByTestId('displayName')).toHaveTextContent('Guest-abc123de');
      });
    });

    it('should use first 8 characters of UID for anonymous display name', async () => {
      const mockUser = {
        uid: 'verylonguserid123456789',
        isAnonymous: true,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('displayName')).toHaveTextContent('Guest-verylong');
      });
    });
  });

  describe('Authenticated User Handling', () => {
    it('should use displayName for authenticated users', async () => {
      const mockUser = {
        uid: 'user123',
        isAnonymous: false,
        email: 'user@example.com',
        displayName: 'John Doe'
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('user123');
        expect(screen.getByTestId('displayName')).toHaveTextContent('John Doe');
      });
    });

    it('should fallback to email if displayName is null', async () => {
      const mockUser = {
        uid: 'user123',
        isAnonymous: false,
        email: 'user@example.com',
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('displayName')).toHaveTextContent('user@example.com');
      });
    });

    it('should fallback to "User" if both displayName and email are null', async () => {
      const mockUser = {
        uid: 'user123',
        isAnonymous: false,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('displayName')).toHaveTextContent('User');
      });
    });
  });

  describe('setUser Function', () => {
    it('should update user state when setUser is called', async () => {
      renderWithProvider(<TestComponent />);
      
      // Initially no user
      expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
      
      // Click button to set user
      screen.getByTestId('setUser').click();
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('test-uid');
        expect(screen.getByTestId('displayName')).toHaveTextContent('Guest-test-ui');
      });
    });

    it('should clear user state when setUser is called with null', async () => {
      // Start with a user
      const mockUser = {
        uid: 'user123',
        isAnonymous: true,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('user123');
      });
      
      screen.getByTestId('clearUser').click();
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
      });
    });
  });

  describe('Context Error Handling', () => {
    it('should throw error when useUser is called outside UserProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useUser must be used within a UserProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Auth State Changes', () => {
    it('should update when auth state changes from null to user', async () => {
      const { rerender } = renderWithProvider(<TestComponent />);
      
      // Initially no user
      expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
      
      // Simulate auth state change
      const mockUser = {
        uid: 'newuser123',
        isAnonymous: true,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      rerender(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('newuser123');
        expect(screen.getByTestId('displayName')).toHaveTextContent('Guest-newuser');
      });
    });

    it('should update when auth state changes from user to null', async () => {
      const mockUser = {
        uid: 'user123',
        isAnonymous: true,
        email: null,
        displayName: null
      } as any;
      
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      
      const { rerender } = renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('user123');
      });
      
      // Simulate user signing out
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      
      rerender(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('no-user');
        expect(screen.getByTestId('displayName')).toHaveTextContent('no-display');
      });
    });
  });
}); 