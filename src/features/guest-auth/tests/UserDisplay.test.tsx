import { render, screen } from '@testing-library/react';
import { UserDisplay } from '../components/UserDisplay';
import { useUser } from '@/features/guest-auth/contexts/UserContext';

jest.mock('@/features/guest-auth/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('UserDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      userId: null,
      displayName: null,
      setUser: jest.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('should not render when no user is signed in or alias missing', () => {
      render(<UserDisplay />);
      
      expect(screen.queryByText('Playing as:')).not.toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should render when alias is present', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'AliasName',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      expect(screen.getByText('Playing as:')).toBeInTheDocument();
      expect(screen.getByText('AliasName')).toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should display only alias (not UID)', () => {
      mockUseUser.mockReturnValue({
        userId: 'verylonguserid123456789',
        displayName: 'Alias-verylong',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      expect(screen.getByText('Alias-verylong')).toBeInTheDocument();
      expect(screen.queryByText('verylonguserid123456789')).not.toBeInTheDocument();
    });
  });

  

  describe('UI Elements', () => {
    it('should render only alias when user is signed in', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Alias-abc123',
        setUser: jest.fn(),
      });
      
      render(<UserDisplay />);
      
      expect(screen.getByText('Playing as:')).toBeInTheDocument();
      expect(screen.getByText('Alias-abc123')).toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
      expect(screen.queryByText('user123')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copy id/i })).not.toBeInTheDocument();
    });

  });
}); 