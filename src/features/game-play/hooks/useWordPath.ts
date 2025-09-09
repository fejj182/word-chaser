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
    minLength = 1,
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

  const canFormWordOnGrid = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return false;
    return canFormWord(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  const pathValidation = useMemo(() => {
    if (state.selectedPath.length === 0) {
      return { isValid: true, word: '' };
    }
    return validatePath(state.grid, state.selectedPath);
  }, [state.grid, state.selectedPath]);

  // Check if current path is valid (for pathfinding, not submission)
  const isValidPath = useMemo(() => {
    if (state.selectedPath.length > 0) {
      return pathValidation.isValid;
    }
    
    if (state.currentWord && state.currentWord.length > 0) {
      return canFormWordOnGrid(state.currentWord);
    }
    
    return true;
  }, [pathValidation.isValid, state.selectedPath.length, state.currentWord, canFormWordOnGrid]);

  const isPositionInCurrentPath = useCallback((position: GridPosition) => {
    return state.selectedPath.some(p => p.row === position.row && p.col === position.col);
  }, [state.selectedPath]);

  const findPathsForWord = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return [];
    return findWordPaths(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  const findBestPathForWord = useCallback((word: string) => {
    if (!word || !state.grid || state.grid.length === 0) return null;
    return findBestWordPath(state.grid, word, pathfindingOptions);
  }, [state.grid, pathfindingOptions]);

  // Select a tile (add to path)
  const selectTile = useCallback((position: GridPosition) => {
    if (!state.grid || position.row < 0 || position.row >= state.grid.length ||
        position.col < 0 || position.col >= state.grid[0]?.length) {
      return;
    }

    if (state.selectedPath.length === 0) {
      actions.selectTile(position);
      return;
    }

    if (isPositionInCurrentPath(position)) {
      return;
    }

    const lastPos = state.selectedPath[state.selectedPath.length - 1];
    const isAdjacent = Math.max(
      Math.abs(position.row - lastPos.row),
      Math.abs(position.col - lastPos.col)
    ) === 1;

    if (!isAdjacent) {
      actions.clearSelection();
    }

    actions.selectTile(position);
  }, [state.selectedPath, actions, isPositionInCurrentPath]);

  const clearSelection = useCallback(() => {
    actions.clearSelection();
  }, [actions]);

  const setWordFromPath = useCallback((path: GridPosition[]) => {
    const word = path.map(pos => state.grid[pos.row]?.[pos.col] || '').join('');
    actions.setCurrentWord(word);
  }, [state.grid, actions]);

  const getNextSelectablePositions = useCallback((allowDiagonalsOverride?: boolean) => {
    const useDiagonals = allowDiagonalsOverride !== undefined ? allowDiagonalsOverride : allowDiagonals;
    return getNextValidPositionsUtil(state.grid, state.selectedPath, useDiagonals, allowReuse);
  }, [state.grid, state.selectedPath, allowDiagonals, allowReuse]);

  const isPositionSelectable = useCallback((position: GridPosition) => {
    if (!state.grid || position.row < 0 || position.row >= state.grid.length ||
        position.col < 0 || position.col >= state.grid[0]?.length) {
      return false;
    }

    return isPositionInCurrentPath(position);
  }, [state.grid, isPositionInCurrentPath]);

  const setCurrentWord = useCallback((word: string) => {
    actions.setCurrentWord(word);
  }, [actions]);

  const findPathForTypedWord = useCallback((word: string) => {
    if (!word || state.grid.length === 0) return null;
    
    const path = findBestWordPath(state.grid, word, pathfindingOptions);
    if (path) {
      actions.clearSelection();
      path.forEach(pos => actions.selectTile(pos));
    } else {
      // Don't clear selection when word cannot be formed - keep the typed word
      // but clear any existing selected path so validation works correctly
      if (state.selectedPath.length > 0) {
        actions.clearSelection();
        // Restore the current word after clearing selection
        actions.setCurrentWord(word);
      }
    }
    
    return path;
  }, [state.grid, pathfindingOptions, actions, state.selectedPath.length]);

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

