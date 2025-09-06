import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridDebugControls } from '../GridDebugControls';
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';

// Mock the grid generation utility
jest.mock('@/lib/utils/grid-generation', () => ({
  validateGridQuality: jest.fn(() => true),
  getGridSizeConfig: jest.fn((size) => size === 'small' ? 4 : 6),
  generateLetterGrid: jest.fn(() => [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P']
  ])
}));

describe('GridDebugControls', () => {
  it('should render debug controls', () => {
    render(
      <GamePlayProvider initialGridSize="small">
        <GridDebugControls />
      </GamePlayProvider>
    );

    expect(screen.getByText('Grid Debug Controls')).toBeInTheDocument();
    expect(screen.getByText('🎲 Regenerate Grid')).toBeInTheDocument();
    expect(screen.getByText('Grid Statistics')).toBeInTheDocument();
  });

  it('should display grid statistics', () => {
    render(
      <GamePlayProvider initialGridSize="small">
        <GridDebugControls />
      </GamePlayProvider>
    );

    expect(screen.getByText('Size:')).toBeInTheDocument();
    expect(screen.getByText('Total Tiles:')).toBeInTheDocument();
    expect(screen.getByText('Unique Letters:')).toBeInTheDocument();
    expect(screen.getByText('Quality:')).toBeInTheDocument();
  });

  it('should have regenerate button that can be clicked', () => {
    render(
      <GamePlayProvider initialGridSize="small">
        <GridDebugControls />
      </GamePlayProvider>
    );

    const regenerateButton = screen.getByRole('button', { name: /generate a new random grid/i });
    expect(regenerateButton).toBeInTheDocument();
    
    // Button should be clickable
    fireEvent.click(regenerateButton);
    // No error should be thrown
  });
});
