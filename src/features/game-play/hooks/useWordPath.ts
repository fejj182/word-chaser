'use client';

import { useCallback, useMemo } from 'react';
import { useGamePlay } from '../contexts/GamePlayContext';
import { 
  findWordPaths, 
  findBestWordPath, 
  canFormWord, 
  validatePath,
  getNextValidPositions as getNextValidPositionsUtil,
  GridPosition,
  PathfindingOptions 
} from '@/lib/utils/pathfinding';

export interface UseWordPathOptions extends PathfindingOptions {
  debounceMs?: number;
}

export interface UseWordPathReturn {
  // Path operations
  findPathsForWord: (word: string) => GridPosition[][];
  findBestPathForWord: (word: string) => GridPosition[] | null;
  canFormWordOnGrid: (word: string) => boolean;
  
  // Current state
  currentWord: string;
  selectedPath: GridPosition[];
  isValidPath: boolean;
  pathValidation: { isValid: boolean; word: string; error?: string };
  
  // Path manipulation
  selectTile: (position: GridPosition) => void;
  clearSelection: () => void;
  setWordFromPath: (path: GridPosition[]) => void;
  
  // Grid analysis
  getNextSelectablePositions: (allowDiagonals?: boolean) => GridPosition[];
  isPositionSelectable: (position: GridPosition) => boolean;
  isPositionInCurrentPath: (position: GridPosition) => boolean;
  
  // Word input integration
  setCurrentWord: (word: string) => void;
  findPathForTypedWord: (word: string) => GridPosition[] | null;
}

/**
 * Hook for managing word pathfinding and grid interactions
 */
export function useWordPath(options: UseWordPathOptions = {}): UseWordPathReturn {
  const { state, actions } = useGamePlay();
  const {
    allowDiagonals = true,
    minLength = 3,
    maxLength = 16,
    allowReuse = false,
    debounceMs = 150
  } = options;

  const pathfindingOptions: PathfindingOptions = {
    allowDiagonals,
    minLength,
    maxLength,
    allowReuse
  };

  // Memoized path validation
  const pathValidation = useMemo(() => {
    if (state.selectedPath.length === 0) {
      return { isValid: true, word: '' };
    }
    return validatePath(state.grid, state.selectedPath);
  }, [state.grid, state.selectedPath]);

  // Check if current path is valid
  const isValidPath = useMemo(() => {
    return pathValidation.isValid && state.selectedPath.length >= minLength;
  }, [pathValidation.isValid, state.selectedPath.length, minLength]);

  // Check if a position is in the current path
  const isPositionInCurrentPath = useCallback((position: GridPosition) => {
    return state.selectedPath.some(p => p.row === position.row && p.col === position.col);
  }, [state.selectedPath]);

  // Find paths for a given word
  const findPathsForWord = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return [];
    return findWordPaths(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  // Find the best path for a word
  const findBestPathForWord = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return null;
    return findBestWordPath(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  // Check if a word can be formed
  const canFormWordOnGrid = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return false;
    return canFormWord(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  // Select a tile (add to path)
  const selectTile = useCallback((position: GridPosition) => {
    // Check bounds
    if (!state.grid || position.row < 0 || position.row >= state.grid.length ||
        position.col < 0 || position.col >= state.grid[0]?.length) {
      return;
    }

    // If this is the first selection, just add it
    if (state.selectedPath.length === 0) {
      actions.selectTile(position);
      return;
    }

    // Check if tile has already been selected
    if (isPositionInCurrentPath(position)) {
      return;
    }

    // Check if position is adjacent to the last selected position
    const lastPos = state.selectedPath[state.selectedPath.length - 1];
    const isAdjacent = Math.max(
      Math.abs(position.row - lastPos.row),
      Math.abs(position.col - lastPos.col)
    ) === 1;

    if (!isAdjacent) {
      // If not adjacent, start a new path from this position
      actions.clearSelection();
    }

    actions.selectTile(position);
  }, [state.selectedPath, actions, isPositionInCurrentPath]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    actions.clearSelection();
  }, [actions]);

  // Set word from a path
  const setWordFromPath = useCallback((path: GridPosition[]) => {
    const word = path.map(pos => state.grid[pos.row]?.[pos.col] || '').join('');
    actions.setCurrentWord(word);
  }, [state.grid, actions]);

  // Get next selectable positions from current path
  const getNextSelectablePositions = useCallback((allowDiagonalsOverride?: boolean) => {
    const useDiagonals = allowDiagonalsOverride !== undefined ? allowDiagonalsOverride : allowDiagonals;
    return getNextValidPositionsUtil(state.grid, state.selectedPath, useDiagonals, allowReuse);
  }, [state.grid, state.selectedPath, allowDiagonals, allowReuse]);

  // Check if a position is selectable
  const isPositionSelectable = useCallback((position: GridPosition) => {
    // Check bounds
    if (!state.grid || position.row < 0 || position.row >= state.grid.length ||
        position.col < 0 || position.col >= state.grid[0]?.length) {
      return false;
    }

    // Only positions already in the current path are selectable
    return isPositionInCurrentPath(position);
  }, [state.grid, isPositionInCurrentPath]);

  // Set current word (for typing integration)
  const setCurrentWord = useCallback((word: string) => {
    actions.setCurrentWord(word);
  }, [actions]);

  // Find path for a typed word
  const findPathForTypedWord = useCallback((word: string) => {
    if (!word || state.grid.length === 0) return null;
    
    const path = findBestWordPath(state.grid, word, pathfindingOptions);
    if (path) {
      // Update the selected path to match the found path
      actions.clearSelection();
      path.forEach(pos => actions.selectTile(pos));
    }
    
    return path;
  }, [state.grid, pathfindingOptions, actions]);

  return {
    // Path operations
    findPathsForWord,
    findBestPathForWord,
    canFormWordOnGrid,
    
    // Current state
    currentWord: state.currentWord,
    selectedPath: state.selectedPath,
    isValidPath,
    pathValidation,
    
    // Path manipulation
    selectTile,
    clearSelection,
    setWordFromPath,
    
    // Grid analysis
    getNextSelectablePositions,
    isPositionSelectable,
    isPositionInCurrentPath,
    
    // Word input integration
    setCurrentWord,
    findPathForTypedWord
  };
}

