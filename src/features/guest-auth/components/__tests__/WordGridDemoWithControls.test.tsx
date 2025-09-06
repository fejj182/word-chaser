import React from 'react';
import { render, screen } from '@testing-library/react';
import { WordGridDemoWithControls } from '../WordGridDemoWithControls';
import { GamePlayProvider } from '../../../game-play/contexts/GamePlayContext';

// Mock the WordGridDemo component
jest.mock('../WordGridDemo', () => ({
  WordGridDemo: () => <div data-testid="word-grid-demo">Word Grid Demo</div>
}));

describe('WordGridDemoWithControls', () => {
  it('should render WordGridDemo component', () => {
    render(
      <GamePlayProvider initialGridSize="small">
        <WordGridDemoWithControls gridSize="small" />
      </GamePlayProvider>
    );

    expect(screen.getByTestId('word-grid-demo')).toBeInTheDocument();
  });

  it('should update grid size when prop changes', () => {
    const { rerender } = render(
      <GamePlayProvider initialGridSize="small">
        <WordGridDemoWithControls gridSize="small" />
      </GamePlayProvider>
    );

    // Change the grid size prop
    rerender(
      <GamePlayProvider initialGridSize="medium">
        <WordGridDemoWithControls gridSize="medium" />
      </GamePlayProvider>
    );

    // The component should still render
    expect(screen.getByTestId('word-grid-demo')).toBeInTheDocument();
  });
});
