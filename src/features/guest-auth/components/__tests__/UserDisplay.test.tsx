import { render, screen } from '@testing-library/react';
import { UserDisplay } from '../UserDisplay';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('UserDisplay', () => {
  describe('Component Rendering', () => {
    it('should not render when no displayName is provided', () => {
      render(<UserDisplay displayName={null} />);
      
      expect(screen.queryByText('Playing as:')).not.toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should not render when empty string is provided', () => {
      render(<UserDisplay displayName="" />);
      
      expect(screen.queryByText('Playing as:')).not.toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should render when displayName is present', () => {
      render(<UserDisplay displayName="AliasName" />);
      
      expect(screen.getByText('Playing as:')).toBeInTheDocument();
      expect(screen.getByText('AliasName')).toBeInTheDocument();
      expect(screen.queryByText('Share this ID:')).not.toBeInTheDocument();
    });

    it('should display the provided displayName', () => {
      render(<UserDisplay displayName="Alias-verylong" />);
      
      expect(screen.getByText('Alias-verylong')).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    it('should have proper text hierarchy', () => {
      render(<UserDisplay displayName="Test User" />);
      
      expect(screen.getByText('Playing as:')).toHaveClass('text--label');
      expect(screen.getByText('Test User')).toHaveClass('text--heading');
    });
  });
}); 