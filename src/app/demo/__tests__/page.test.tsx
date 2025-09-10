import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DemoPage from '../page';

// Mock the components to avoid complex dependencies
jest.mock('@/features/development/components/WordGridDemo', () => ({
  WordGridDemo: ({ gridSize }: { gridSize: string }) => (
    <div data-testid="word-grid-demo">
      Word Grid Demo - Size: {gridSize}
    </div>
  )
}));

jest.mock('@/features/development/components/GridDebugControls', () => ({
  GridDebugControls: () => <div data-testid="grid-debug-controls">Grid Debug Controls</div>
}));

jest.mock('@/features/game-play/components/GridSizeSelector', () => ({
  GridSizeSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div data-testid="grid-size-selector">
      <button 
        onClick={() => onChange('medium')}
        data-testid="change-to-medium"
      >
        Change to Medium
      </button>
      <span data-testid="current-size">{value}</span>
    </div>
  )
}));

jest.mock('@/features/game-play/contexts/GamePlayContext', () => ({
  GamePlayProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="game-play-provider">{children}</div>
  )
}));

describe('DemoPage', () => {
  it('should render the demo page with all components', () => {
    render(<DemoPage />);

    expect(screen.getByText('Grid Debug Demo')).toBeInTheDocument();
    expect(screen.getByText('Development tool for testing and debugging grid-related functionality')).toBeInTheDocument();
    expect(screen.getByTestId('grid-size-selector')).toBeInTheDocument();
    expect(screen.getByTestId('grid-debug-controls')).toBeInTheDocument();
    expect(screen.getByTestId('word-grid-demo')).toBeInTheDocument();
  });

  it('should display debug information', () => {
    render(<DemoPage />);

    expect(screen.getByText('Debug Controls')).toBeInTheDocument();
    expect(screen.getByText('Grid Configuration')).toBeInTheDocument();
    expect(screen.getByText('Debug Information')).toBeInTheDocument();
    expect(screen.getByText('Development Notes')).toBeInTheDocument();
  });

  it('should show current grid size information', () => {
    render(<DemoPage />);

    expect(screen.getByText('Current size: 6×6 grid')).toBeInTheDocument();
    expect(screen.getByText('Grid Size:')).toBeInTheDocument();
    expect(screen.getByText('Total Tiles:')).toBeInTheDocument();
  });

  it('should allow changing grid size', () => {
    render(<DemoPage />);

    const changeButton = screen.getByTestId('change-to-medium');
    fireEvent.click(changeButton);

    // The grid size selector should show the new size
    expect(screen.getByTestId('current-size')).toHaveTextContent('medium');
  });
});
