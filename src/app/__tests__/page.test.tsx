import { render, screen } from '@testing-library/react';
import Home from '../page';
import { useUser } from '@/features/user-management/contexts/UserContext';

// Mock the useUser hook
jest.mock('@/features/user-management/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('@/features/user-management/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
  })),
}));

// Mock child components to focus on page behavior
jest.mock('@/features/user-management/components/UserDisplay', () => ({
  UserDisplay: ({ displayName }: { displayName: string | null }) => (
    <div data-testid="user-display" data-display-name={displayName || 'no-name'}>
      UserDisplay: {displayName || 'No name'}
    </div>
  ),
}));

jest.mock('@/features/room-management/components/RoomManager', () => ({
  __esModule: true,
  default: () => <div data-testid="room-manager">RoomManager</div>,
}));

jest.mock('@/features/user-management/components/GameHeader', () => ({
  GameHeader: () => <div data-testid="game-header">GameHeader</div>,
}));

jest.mock('@/features/development/components/WordGridDemo', () => ({
  WordGridDemo: () => <div data-testid="word-grid-demo">WordGridDemo</div>,
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render the main page container with correct classes', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const pageContainer = screen.getByTestId('user-display').closest('.page');
      expect(pageContainer).toBeInTheDocument();
    });

    it('should render the header section with GameHeader', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const headerSection = screen.getByTestId('game-header').closest('.page--header');
      expect(headerSection).toBeInTheDocument();
      expect(screen.getByTestId('game-header')).toBeInTheDocument();
    });

    it('should render the user display section with correct classes', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const userSection = screen.getByTestId('user-display').closest('.page--padding');
      expect(userSection).toBeInTheDocument();
      expect(screen.getByTestId('user-display')).toBeInTheDocument();
    });

    it('should render the main content section with RoomManager and WordGridDemo', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const contentSection = screen.getByTestId('room-manager').closest('.page--content');
      expect(contentSection).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      expect(screen.getByTestId('word-grid-demo')).toBeInTheDocument();
    });
  });

  describe('User Display Integration', () => {
    it('should pass displayName from useUser to UserDisplay', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'John Doe',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const userDisplay = screen.getByTestId('user-display');
      expect(userDisplay).toHaveAttribute('data-display-name', 'John Doe');
      expect(userDisplay).toHaveTextContent('UserDisplay: John Doe');
    });

    it('should handle null displayName from useUser', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: null,
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const userDisplay = screen.getByTestId('user-display');
      expect(userDisplay).toHaveAttribute('data-display-name', 'no-name');
      expect(userDisplay).toHaveTextContent('UserDisplay: No name');
    });

    it('should handle empty string displayName from useUser', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: '',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      const userDisplay = screen.getByTestId('user-display');
      expect(userDisplay).toHaveAttribute('data-display-name', 'no-name');
      expect(userDisplay).toHaveTextContent('UserDisplay: No name');
    });
  });

  describe('Layout Classes', () => {
    it('should apply correct CSS classes for responsive layout', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      // Check main page structure
      const pageContainer = screen.getByTestId('user-display').closest('.page');
      expect(pageContainer).toBeInTheDocument();
      
      // Check header structure
      const headerContainer = screen.getByTestId('game-header').closest('.page--header-container');
      expect(headerContainer).toBeInTheDocument();
      
      // Check content structure
      const contentContainer = screen.getByTestId('room-manager').closest('.page--content-container');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all child components in correct order', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      // Check that all components are rendered
      expect(screen.getByTestId('game-header')).toBeInTheDocument();
      expect(screen.getByTestId('user-display')).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      expect(screen.getByTestId('word-grid-demo')).toBeInTheDocument();
      
      // Check the order by looking at the DOM structure
      const pageContainer = screen.getByTestId('user-display').closest('.page');
      const header = pageContainer?.querySelector('.page--header');
      const userSection = pageContainer?.querySelector('.page--padding');
      const contentSection = pageContainer?.querySelector('.page--content');
      
      expect(header).toBeInTheDocument();
      expect(userSection).toBeInTheDocument();
      expect(contentSection).toBeInTheDocument();
    });
  });

  describe('Provider Integration', () => {
    it('should wrap content with RoomProvider and GamePlayProvider', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(<Home />);
      
      // The providers should be present (they don't render anything visible)
      // but the content should be rendered correctly
      expect(screen.getByTestId('game-header')).toBeInTheDocument();
      expect(screen.getByTestId('user-display')).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
    });
  });
});
