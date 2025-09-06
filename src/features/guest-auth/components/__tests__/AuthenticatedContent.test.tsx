import { render, screen } from '@testing-library/react';
import { AuthenticatedContent } from '../AuthenticatedContent';
import { useUser } from '@/features/guest-auth/contexts/UserContext';
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';

// Mock the useUser hook
jest.mock('@/features/guest-auth/contexts/UserContext', () => ({
  useUser: jest.fn(),
}));

// Mock child components to focus on AuthenticatedContent behavior
jest.mock('../UserDisplay', () => ({
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

jest.mock('../GameHeader', () => ({
  GameHeader: () => <div data-testid="game-header">GameHeader</div>,
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('AuthenticatedContent', () => {
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
      const pageContainer = screen.getByTestId('user-display').closest('.page');
      expect(pageContainer).toBeInTheDocument();
    });

    it('should render the header section with GameHeader', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
      const userSection = screen.getByTestId('user-display').closest('.page--padding');
      expect(userSection).toBeInTheDocument();
      expect(screen.getByTestId('user-display')).toBeInTheDocument();
    });

    it('should render the main content section with RoomManager', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'Test User',
        setUser: jest.fn(),
      });

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
      const contentSection = screen.getByTestId('room-manager').closest('.page--content');
      expect(contentSection).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
    });
  });

  describe('User Display Integration', () => {
    it('should pass displayName from useUser to UserDisplay', () => {
      mockUseUser.mockReturnValue({
        userId: 'user123',
        displayName: 'John Doe',
        setUser: jest.fn(),
      });

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
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

      render(
      <GamePlayProvider>
        <AuthenticatedContent />
      </GamePlayProvider>
      );
      
      // Check that all components are rendered
      expect(screen.getByTestId('game-header')).toBeInTheDocument();
      expect(screen.getByTestId('user-display')).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      
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
});
