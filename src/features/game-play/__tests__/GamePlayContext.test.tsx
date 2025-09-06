import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GamePlayProvider, useGamePlay } from '../contexts/GamePlayContext';

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { state, actions } = useGamePlay();

  return (
    <div>
      <div data-testid="grid-size">{state.gridSize}</div>
      <div data-testid="grid-length">{state.grid.length}</div>
      <div data-testid="current-word">{state.currentWord}</div>
      <div data-testid="selected-path-length">{state.selectedPath.length}</div>
      
      <button 
        data-testid="set-small" 
        onClick={() => actions.setGridSize('small')}
      >
        Set Small
      </button>
      
      <button 
        data-testid="set-medium" 
        onClick={() => actions.setGridSize('medium')}
      >
        Set Medium
      </button>
      
      <button 
        data-testid="generate-grid" 
        onClick={() => actions.generateGrid()}
      >
        Generate Grid
      </button>
      
      <button 
        data-testid="select-tile" 
        onClick={() => actions.selectTile({ row: 0, col: 0 })}
      >
        Select Tile
      </button>
      
      <button 
        data-testid="set-word" 
        onClick={() => actions.setCurrentWord('TEST')}
      >
        Set Word
      </button>
      
      <button 
        data-testid="clear-selection" 
        onClick={() => actions.clearSelection()}
      >
        Clear Selection
      </button>
      
      <button 
        data-testid="load-grid" 
        onClick={() => actions.loadGridFromRoom([['A', 'B'], ['C', 'D']], 'small')}
      >
        Load Grid
      </button>
    </div>
  );
};

// Wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GamePlayProvider>{children}</GamePlayProvider>
);

describe('GamePlayContext', () => {
  it('should provide initial state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('grid-size')).toHaveTextContent('small');
    expect(screen.getByTestId('grid-length')).toHaveTextContent('0');
    expect(screen.getByTestId('current-word')).toHaveTextContent('');
    expect(screen.getByTestId('selected-path-length')).toHaveTextContent('0');
  });

  it('should change grid size', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-medium'));
    expect(screen.getByTestId('grid-size')).toHaveTextContent('medium');

    fireEvent.click(screen.getByTestId('set-small'));
    expect(screen.getByTestId('grid-size')).toHaveTextContent('small');
  });

  it('should generate grid', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('generate-grid'));
    
    // Should have a 4x4 grid (small size)
    expect(screen.getByTestId('grid-length')).toHaveTextContent('4');
  });

  it('should select tiles and build word', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Generate grid first
    fireEvent.click(screen.getByTestId('generate-grid'));
    
    // Select a tile
    fireEvent.click(screen.getByTestId('select-tile'));
    
    expect(screen.getByTestId('selected-path-length')).toHaveTextContent('1');
    expect(screen.getByTestId('current-word')).not.toHaveTextContent('');
  });

  it('should set current word', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('set-word'));
    expect(screen.getByTestId('current-word')).toHaveTextContent('TEST');
  });

  it('should clear selection', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Generate grid, select tile, and set word
    fireEvent.click(screen.getByTestId('generate-grid'));
    fireEvent.click(screen.getByTestId('select-tile'));
    fireEvent.click(screen.getByTestId('set-word'));
    
    expect(screen.getByTestId('selected-path-length')).toHaveTextContent('1');
    expect(screen.getByTestId('current-word')).toHaveTextContent('TEST');
    
    // Clear selection
    fireEvent.click(screen.getByTestId('clear-selection'));
    
    expect(screen.getByTestId('selected-path-length')).toHaveTextContent('0');
    expect(screen.getByTestId('current-word')).toHaveTextContent('');
  });

  it('should load grid from room data', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Load grid from room
    fireEvent.click(screen.getByTestId('load-grid'));
    
    expect(screen.getByTestId('grid-length')).toHaveTextContent('2');
    expect(screen.getByTestId('grid-size')).toHaveTextContent('small');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useGamePlay must be used within a GamePlayProvider');

    console.error = originalError;
  });
});
