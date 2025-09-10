import { renderHook, act } from '@testing-library/react';
import { useWordPath } from '../useWordPath';
import { useGamePlay } from '../../contexts/GamePlayContext';

// Mock the GamePlayContext
jest.mock('../../contexts/GamePlayContext');

const mockUseGamePlay = useGamePlay as jest.MockedFunction<typeof useGamePlay>;

// Mock pathfinding utilities
jest.mock('@/lib/utils/pathfinding', () => ({
  findWordPaths: jest.fn(),
  findBestWordPath: jest.fn(),
  canFormWord: jest.fn(),
  validatePath: jest.fn(),
  getNextValidPositions: jest.fn(),
}));

import {
  findWordPaths,
  findBestWordPath,
  canFormWord,
  validatePath,
  getNextValidPositions,
} from '@/lib/utils/pathfinding';

const mockFindWordPaths = findWordPaths as jest.MockedFunction<typeof findWordPaths>;
const mockFindBestWordPath = findBestWordPath as jest.MockedFunction<typeof findBestWordPath>;
const mockCanFormWord = canFormWord as jest.MockedFunction<typeof canFormWord>;
const mockValidatePath = validatePath as jest.MockedFunction<typeof validatePath>;
const mockGetNextValidPositions = getNextValidPositions as jest.MockedFunction<typeof getNextValidPositions>;

describe('useWordPath', () => {
  const mockGrid = [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'I']
  ];

  const mockActions = {
    selectTile: jest.fn(),
    clearSelection: jest.fn(),
    setCurrentWord: jest.fn(),
    setAvailablePaths: jest.fn(),
    clearSelectedPath: jest.fn(),
  };

  const defaultMockState = {
    grid: mockGrid,
    selectedPath: [],
    availablePaths: [],
    currentWord: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseGamePlay.mockReturnValue({
      state: defaultMockState,
      actions: mockActions,
    });

    // Default mock implementations
    mockFindWordPaths.mockReturnValue([]);
    mockFindBestWordPath.mockReturnValue(null);
    mockCanFormWord.mockReturnValue(false);
    mockValidatePath.mockReturnValue({ isValid: true, word: '' });
    mockGetNextValidPositions.mockReturnValue([]);
  });

  describe('Path Operations', () => {
    it('should find paths for a word', () => {
      const mockPaths = [
        [{ row: 0, col: 0 }, { row: 0, col: 1 }],
        [{ row: 1, col: 0 }, { row: 1, col: 1 }]
      ];
      mockFindWordPaths.mockReturnValue(mockPaths);

      const { result } = renderHook(() => useWordPath());

      const paths = result.current.findPathsForWord('AB');
      
      expect(mockFindWordPaths).toHaveBeenCalledWith(mockGrid, 'AB', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
      expect(paths).toEqual(mockPaths);
    });

    it('should find best path for a word', () => {
      const mockBestPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockFindBestWordPath.mockReturnValue(mockBestPath);

      const { result } = renderHook(() => useWordPath());

      const bestPath = result.current.findBestPathForWord('AB');
      
      expect(mockFindBestWordPath).toHaveBeenCalledWith(mockGrid, 'AB', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
      expect(bestPath).toEqual(mockBestPath);
    });

    it('should check if word can be formed', () => {
      mockCanFormWord.mockReturnValue(true);

      const { result } = renderHook(() => useWordPath());

      const canForm = result.current.canFormWordOnGrid('ABC');
      
      expect(mockCanFormWord).toHaveBeenCalledWith(mockGrid, 'ABC', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
      expect(canForm).toBe(true);
    });

    it('should return empty results for empty word', () => {
      const { result } = renderHook(() => useWordPath());

      const paths = result.current.findPathsForWord('');
      const bestPath = result.current.findBestPathForWord('');
      const canForm = result.current.canFormWordOnGrid('');

      expect(paths).toEqual([]);
      expect(bestPath).toBeNull();
      expect(canForm).toBe(false);
    });

    it('should return empty results for empty grid', () => {
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, grid: [] },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      const paths = result.current.findPathsForWord('ABC');
      const bestPath = result.current.findBestPathForWord('ABC');
      const canForm = result.current.canFormWordOnGrid('ABC');

      expect(paths).toEqual([]);
      expect(bestPath).toBeNull();
      expect(canForm).toBe(false);
    });
  });

  describe('Path Validation', () => {
    it('should validate current path', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      mockValidatePath.mockReturnValue({ isValid: true, word: 'AB' });

      const { result } = renderHook(() => useWordPath());

      expect(mockValidatePath).toHaveBeenCalledWith(mockGrid, mockSelectedPath);
      expect(result.current.pathValidation).toEqual({ isValid: true, word: 'AB' });
    });

    it('should determine if path is valid based on length', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      mockValidatePath.mockReturnValue({ isValid: true, word: 'ABC' });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.isValidPath).toBe(true);
    });

    it('should mark path as valid regardless of length (pathfinding only)', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      mockValidatePath.mockReturnValue({ isValid: true, word: 'AB' });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.isValidPath).toBe(true);
    });

    it('should handle empty path', () => {
      mockValidatePath.mockReturnValue({ isValid: true, word: '' });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.pathValidation).toEqual({ isValid: true, word: '' });
      expect(result.current.isValidPath).toBe(true);
    });
  });

  describe('Tile Selection', () => {
    it('should select first tile', () => {
      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.selectTile({ row: 0, col: 0 });
      });

      expect(mockActions.selectTile).toHaveBeenCalledWith({ row: 0, col: 0 });
    });

    it('should select adjacent tile', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.selectTile({ row: 0, col: 1 });
      });

      expect(mockActions.selectTile).toHaveBeenCalledWith({ row: 0, col: 1 });
    });

    it('should clear selection and start new path when non-adjacent tile is clicked', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.selectTile({ row: 2, col: 2 }); // Non-adjacent
      });

      // The hook should clear selection and start a new path from the non-adjacent tile
      expect(mockActions.clearSelection).toHaveBeenCalled();
      expect(mockActions.selectTile).toHaveBeenCalledWith({ row: 2, col: 2 });
    });

    it('should not select invalid position', () => {
      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.selectTile({ row: -1, col: 0 }); // Invalid position
      });

      expect(mockActions.selectTile).not.toHaveBeenCalled();
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.clearSelection();
      });

      expect(mockActions.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Position Analysis', () => {
    it('should check if position is selectable (only positions in current path)', () => {
      const { result } = renderHook(() => useWordPath());

      // With no current path, no position should be selectable
      const isSelectable = result.current.isPositionSelectable({ row: 0, col: 0 });
      expect(isSelectable).toBe(false);
    });

    it('should reject out-of-bounds positions', () => {
      const { result } = renderHook(() => useWordPath());

      expect(result.current.isPositionSelectable({ row: -1, col: 0 })).toBe(false);
      expect(result.current.isPositionSelectable({ row: 0, col: -1 })).toBe(false);
      expect(result.current.isPositionSelectable({ row: 3, col: 0 })).toBe(false);
      expect(result.current.isPositionSelectable({ row: 0, col: 3 })).toBe(false);
    });

    it('should check if position is in current path', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.isPositionInCurrentPath({ row: 0, col: 0 })).toBe(true);
      expect(result.current.isPositionInCurrentPath({ row: 0, col: 1 })).toBe(true);
      expect(result.current.isPositionInCurrentPath({ row: 0, col: 2 })).toBe(false);
    });

    it('should check if position is in any available path', () => {
      const mockAvailablePaths = [
        [{ row: 0, col: 0 }, { row: 0, col: 1 }],
        [{ row: 1, col: 0 }, { row: 1, col: 1 }]
      ];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, availablePaths: mockAvailablePaths },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.isPositionInAnyPath({ row: 0, col: 0 })).toBe(true);
      expect(result.current.isPositionInAnyPath({ row: 0, col: 1 })).toBe(true);
      expect(result.current.isPositionInAnyPath({ row: 1, col: 0 })).toBe(true);
      expect(result.current.isPositionInAnyPath({ row: 1, col: 1 })).toBe(true);
      expect(result.current.isPositionInAnyPath({ row: 0, col: 2 })).toBe(false);
    });

    it('should get next selectable positions', () => {
      const mockNextPositions = [{ row: 0, col: 1 }, { row: 1, col: 0 }];
      mockGetNextValidPositions.mockReturnValue(mockNextPositions);

      const { result } = renderHook(() => useWordPath());

      const nextPositions = result.current.getNextSelectablePositions();
      
      expect(mockGetNextValidPositions).toHaveBeenCalledWith(
        mockGrid,
        [],
        true, // allowDiagonals
        false // allowReuse
      );
      expect(nextPositions).toEqual(mockNextPositions);
    });

    it('should get next selectable positions with diagonal override', () => {
      const mockNextPositions = [{ row: 0, col: 1 }];
      mockGetNextValidPositions.mockReturnValue(mockNextPositions);

      const { result } = renderHook(() => useWordPath());

      const nextPositions = result.current.getNextSelectablePositions(false);
      
      expect(mockGetNextValidPositions).toHaveBeenCalledWith(
        mockGrid,
        [],
        false, // allowDiagonals override
        false // allowReuse
      );
      expect(nextPositions).toEqual(mockNextPositions);
    });
  });

  describe('Word Input Integration', () => {
    it('should set current word', () => {
      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.setCurrentWord('ABC');
      });

      expect(mockActions.setCurrentWord).toHaveBeenCalledWith('ABC');
    });

    it('should find path for typed word', () => {
      const mockBestPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
      mockFindBestWordPath.mockReturnValue(mockBestPath);

      const { result } = renderHook(() => useWordPath());

      const path = result.current.findPathForTypedWord('ABC');
      
      expect(mockFindBestWordPath).toHaveBeenCalledWith(mockGrid, 'ABC', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
      expect(path).toEqual(mockBestPath);
      expect(mockActions.clearSelection).toHaveBeenCalled();
      expect(mockActions.selectTile).toHaveBeenCalledTimes(3);
    });

    it('should return null for typed word that cannot be formed', () => {
      mockFindBestWordPath.mockReturnValue(null);

      const { result } = renderHook(() => useWordPath());

      const path = result.current.findPathForTypedWord('XYZ');
      
      expect(path).toBeNull();
      // clearSelection should not be called when there's no existing selected path
      expect(mockActions.clearSelection).not.toHaveBeenCalled();
    });

    it('should clear existing selected path when typed word cannot be formed', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });
      
      mockFindBestWordPath.mockReturnValue(null);

      const { result } = renderHook(() => useWordPath());

      const path = result.current.findPathForTypedWord('XYZ');
      
      expect(path).toBeNull();
      expect(mockActions.clearSelection).toHaveBeenCalled();
      expect(mockActions.setCurrentWord).toHaveBeenCalledWith('XYZ');
    });

    it('should set word from path', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      act(() => {
        result.current.setWordFromPath(mockSelectedPath);
      });

      expect(mockActions.setCurrentWord).toHaveBeenCalledWith('ABC');
    });

    it('should find all paths for typed word', () => {
      const mockPaths = [
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
        [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }]
      ];
      mockFindWordPaths.mockReturnValue(mockPaths);

      const { result } = renderHook(() => useWordPath());

      const paths = result.current.selectTilesForWord('ABC');
      
      expect(mockFindWordPaths).toHaveBeenCalledWith(mockGrid, 'ABC', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
      expect(paths).toEqual(mockPaths);
      expect(mockActions.setAvailablePaths).toHaveBeenCalledWith(mockPaths);
      expect(mockActions.clearSelectedPath).toHaveBeenCalled();
      expect(mockActions.selectTile).toHaveBeenCalledTimes(3); // First path selected
    });

    it('should clear available paths when no paths found for typed word', () => {
      mockFindWordPaths.mockReturnValue([]);

      const { result } = renderHook(() => useWordPath());

      const paths = result.current.selectTilesForWord('XYZ');
      
      expect(paths).toEqual([]);
      expect(mockActions.setAvailablePaths).toHaveBeenCalledWith([]);
    });

    it('should clear available paths and restore word when no paths found but existing selection', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });
      
      mockFindWordPaths.mockReturnValue([]);

      const { result } = renderHook(() => useWordPath());

      const paths = result.current.selectTilesForWord('XYZ');
      
      expect(paths).toEqual([]);
      expect(mockActions.setAvailablePaths).toHaveBeenCalledWith([]);
      expect(mockActions.clearSelection).toHaveBeenCalled();
      expect(mockActions.setCurrentWord).toHaveBeenCalledWith('XYZ');
    });
  });

  describe('Options Configuration', () => {
    it('should use custom options', () => {
      const customOptions = {
        allowDiagonals: false,
        minLength: 2,
        maxLength: 8,
        allowReuse: true
      };

      const { result } = renderHook(() => useWordPath(customOptions));

      result.current.findPathsForWord('AB');

      expect(mockFindWordPaths).toHaveBeenCalledWith(mockGrid, 'AB', customOptions);
    });

    it('should use default options when none provided', () => {
      const { result } = renderHook(() => useWordPath());

      result.current.findPathsForWord('ABC');

      expect(mockFindWordPaths).toHaveBeenCalledWith(mockGrid, 'ABC', {
        allowDiagonals: true,
        minLength: 1,
        maxLength: 16,
        allowReuse: false
      });
    });
  });

  describe('State Access', () => {
    it('should provide current word from state', () => {
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, currentWord: 'TEST' },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.currentWord).toBe('TEST');
    });

    it('should provide selected path from state', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.selectedPath).toEqual(mockSelectedPath);
    });

    it('should provide available paths from state', () => {
      const mockAvailablePaths = [
        [{ row: 0, col: 0 }, { row: 0, col: 1 }],
        [{ row: 1, col: 0 }, { row: 1, col: 1 }]
      ];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, availablePaths: mockAvailablePaths },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      expect(result.current.availablePaths).toEqual(mockAvailablePaths);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed grid gracefully', () => {
      const malformedGrid = [
        ['A', 'B'],
        ['C'], // Missing third element
        ['D', 'E', 'F']
      ];
      
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, grid: malformedGrid },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      // Should not throw when accessing grid elements
      expect(() => {
        result.current.setWordFromPath([{ row: 1, col: 2 }]);
      }).not.toThrow();
    });

    it('should handle undefined grid gracefully', () => {
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, grid: undefined as any },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath());

      // Should return empty results for undefined grid
      expect(() => result.current.findPathsForWord('ABC')).not.toThrow();
      expect(() => result.current.findBestPathForWord('ABC')).not.toThrow();
      expect(() => result.current.canFormWordOnGrid('ABC')).not.toThrow();
    });

    it('should handle position reuse correctly', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath({
        allowReuse: false
      }));

      // Position already in path should be selectable (only selected tiles are selectable)
      expect(result.current.isPositionSelectable({ row: 0, col: 0 })).toBe(true);
    });

    it('should allow position reuse when configured', () => {
      const mockSelectedPath = [{ row: 0, col: 0 }];
      mockUseGamePlay.mockReturnValue({
        state: { ...defaultMockState, selectedPath: mockSelectedPath },
        actions: mockActions,
      });

      const { result } = renderHook(() => useWordPath({
        allowReuse: true
      }));

      // Only positions already in the current path are selectable
      expect(result.current.isPositionSelectable({ row: 0, col: 0 })).toBe(true);
      expect(result.current.isPositionSelectable({ row: 0, col: 1 })).toBe(false);
      expect(result.current.isPositionSelectable({ row: 1, col: 0 })).toBe(false);
    });
  });
});
