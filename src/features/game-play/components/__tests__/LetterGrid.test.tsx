import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LetterGrid } from '../LetterGrid';
import { GridSize } from '../../contexts/GamePlayContext';

// Mock the GamePlayContext
jest.mock('../../contexts/GamePlayContext', () => ({
  useGamePlay: jest.fn(),
  GamePlayProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the useWordPath hook
jest.mock('../../hooks/useWordPath', () => ({
  useWordPath: jest.fn(),
}));

const mockUseGamePlay = require('../../contexts/GamePlayContext').useGamePlay;
const mockUseWordPath = require('../../hooks/useWordPath').useWordPath;

describe('LetterGrid', () => {
  const mockSelectTile = jest.fn();
  const mockIsPositionInPath = jest.fn();

  const defaultMockReturn = {
    selectTile: mockSelectTile,
    isPositionInCurrentPath: mockIsPositionInPath,
    currentWord: '',
  };

  const mockGrid = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P']
  ];

  const mockGamePlayState = {
    grid: mockGrid,
    gridSize: 'small' as GridSize,
    currentWord: '',
    isValidating: false,
    validationError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockIsPositionInPath.mockReturnValue(false);
    mockUseWordPath.mockReturnValue(defaultMockReturn);
  });

  const renderWithProvider = (state = mockGamePlayState) => {
    // Mock the GamePlayContext
    const mockGamePlayContext = {
      state,
      actions: {
        setGridSize: jest.fn(),
        generateGrid: jest.fn(),
        loadGridFromRoom: jest.fn(),
        selectTile: jest.fn(),
        setCurrentWord: jest.fn(),
        clearSelection: jest.fn(),
        setValidating: jest.fn(),
        setValidationError: jest.fn(),
      },
    };

    // Set up the mock to return our test state
    mockUseGamePlay.mockReturnValue(mockGamePlayContext);

    return render(<LetterGrid />);
  };

  describe('Rendering', () => {
    it('should render empty state when no grid is present', () => {
      const emptyState = { ...mockGamePlayState, grid: [] };
      renderWithProvider(emptyState);

      expect(screen.getByText('Letter Grid')).toBeInTheDocument();
      expect(screen.getByText('No grid generated yet.')).toBeInTheDocument();
      expect(screen.getByText('Select a grid size and generate a new grid to start playing.')).toBeInTheDocument();
    });

    it('should render grid with correct number of buttons', () => {
      renderWithProvider();

      // Should have 16 buttons for a 4x4 grid
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(16);
    });

    it('should render correct letters in grid', () => {
      renderWithProvider();

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      renderWithProvider();

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label', 'small letter grid');

      const firstButton = screen.getByText('A');
      expect(firstButton).toHaveAttribute('aria-label', 'Letter A at position 1, 1');
      expect(firstButton).toHaveAttribute('aria-pressed', 'false');
      expect(firstButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Click Interactions', () => {
    it('should call selectTile when button is clicked', () => {
      renderWithProvider();

      const buttonA = screen.getByText('A');
      fireEvent.click(buttonA);

      expect(mockSelectTile).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it('should call selectTile for different positions', () => {
      renderWithProvider();

      const buttonP = screen.getByText('P');
      fireEvent.click(buttonP);

      expect(mockSelectTile).toHaveBeenCalledWith({ row: 3, col: 3 });
    });
  });

  describe('Visual States', () => {
    it('should apply correct classes for selected tiles', () => {
      mockIsPositionInPath.mockImplementation(({ row, col }) => row === 0 && col === 0);
      
      renderWithProvider();

      const buttonA = screen.getByText('A');
      expect(buttonA).toHaveClass('bg-blue-500');
      expect(buttonA).toHaveClass('text-white');
      expect(buttonA).toHaveClass('border-blue-600');
    });

    it('should apply correct classes for unselected tiles', () => {
      mockIsPositionInPath.mockReturnValue(false);
      
      renderWithProvider();

      const buttonA = screen.getByText('A');
      expect(buttonA).toHaveClass('bg-gray-100');
      expect(buttonA).toHaveClass('border-gray-200');
      expect(buttonA).toHaveClass('text-gray-500');
      expect(buttonA).toHaveClass('hover:bg-gray-200');
    });

    it('should show current word when available', () => {
      mockUseWordPath.mockReturnValue({
        ...defaultMockReturn,
        currentWord: 'CAT',
      });

      renderWithProvider();

      expect(screen.getByText('Current word: CAT')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should use correct grid columns for 4x4 grid', () => {
      renderWithProvider();

      const grid = screen.getByRole('grid');
      expect(grid).toHaveClass('grid-cols-4');
    });

    it('should use correct grid columns for 6x6 grid', () => {
      const sixBySixGrid = Array(6).fill(null).map(() => Array(6).fill('A'));
      const sixBySixState = { ...mockGamePlayState, grid: sixBySixGrid, gridSize: 'medium' as const };
      
      renderWithProvider(sixBySixState);

      const grid = screen.getByRole('grid');
      expect(grid).toHaveClass('grid-cols-6');
    });


    it('should use correct max width classes', () => {
      renderWithProvider();

      const grid = screen.getByRole('grid');
      expect(grid).toHaveClass('max-w-xs');
    });

    it('should use correct max width for medium grids', () => {
      const sixBySixGrid = Array(6).fill(null).map(() => Array(6).fill('A'));
      const sixBySixState = { ...mockGamePlayState, grid: sixBySixGrid };
      
      renderWithProvider(sixBySixState);

      const grid = screen.getByRole('grid');
      expect(grid).toHaveClass('max-w-sm');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for grid', () => {
      renderWithProvider();

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('role', 'grid');
      expect(grid).toHaveAttribute('aria-label', 'small letter grid');
    });

    it('should have proper ARIA attributes for buttons', () => {
      renderWithProvider();

      const buttonA = screen.getByText('A');
      expect(buttonA).toHaveAttribute('aria-label', 'Letter A at position 1, 1');
      expect(buttonA).toHaveAttribute('aria-pressed', 'false');
      expect(buttonA).toHaveAttribute('tabIndex', '0');
    });

    it('should update aria-pressed when tile is selected', () => {
      mockIsPositionInPath.mockImplementation(({ row, col }) => row === 0 && col === 0);
      
      renderWithProvider();

      const buttonA = screen.getByText('A');
      expect(buttonA).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty grid gracefully', () => {
      const emptyState = { ...mockGamePlayState, grid: [] };
      renderWithProvider(emptyState);

      expect(screen.getByText('No grid generated yet.')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle undefined grid gracefully', () => {
      const undefinedGridState = { ...mockGamePlayState, grid: undefined as any };
      renderWithProvider(undefinedGridState);

      expect(screen.getByText('No grid generated yet.')).toBeInTheDocument();
    });

    it('should handle malformed grid gracefully', () => {
      const malformedGrid = [['A', 'B'], ['C']]; // Inconsistent row lengths
      const malformedState = { ...mockGamePlayState, grid: malformedGrid };
      
      renderWithProvider(malformedState);

      // Should still render what it can
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });
  });
});
