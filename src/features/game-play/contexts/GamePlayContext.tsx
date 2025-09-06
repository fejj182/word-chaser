'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { generateLetterGrid, getGridSizeConfig } from '@/lib/utils/grid-generation';

// Types
export interface GridPosition {
  row: number;
  col: number;
}

export type GridSize = 'small' | 'medium';

export interface GamePlayState {
  grid: string[][];
  gridSize: GridSize;
  selectedPath: GridPosition[];
  currentWord: string;
  isValidating: boolean;
  validationError: string | null;
}

export interface GamePlayActions {
  setGridSize: (size: GridSize) => void;
  generateGrid: () => void;
  loadGridFromRoom: (grid: string[][], gridSize: GridSize) => void;
  selectTile: (position: GridPosition) => void;
  setCurrentWord: (word: string) => void;
  clearSelection: () => void;
  setValidating: (isValidating: boolean) => void;
  setValidationError: (error: string | null) => void;
}

export interface GamePlayContextValue {
  state: GamePlayState;
  actions: GamePlayActions;
}

// Initial state
const initialState: GamePlayState = {
  grid: [],
  gridSize: 'small',
  selectedPath: [],
  currentWord: '',
  isValidating: false,
  validationError: null,
};

// Action types
type GamePlayAction =
  | { type: 'SET_GRID_SIZE'; payload: GridSize }
  | { type: 'GENERATE_GRID'; payload: string[][] }
  | { type: 'LOAD_GRID_FROM_ROOM'; payload: { grid: string[][]; gridSize: GridSize } }
  | { type: 'SELECT_TILE'; payload: GridPosition }
  | { type: 'SET_CURRENT_WORD'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_VALIDATION_ERROR'; payload: string | null };

// Reducer
function gamePlayReducer(state: GamePlayState, action: GamePlayAction): GamePlayState {
  switch (action.type) {
    case 'SET_GRID_SIZE':
      return {
        ...state,
        gridSize: action.payload,
        grid: [],
        selectedPath: [],
        currentWord: '',
        validationError: null,
      };

    case 'GENERATE_GRID':
      return {
        ...state,
        grid: action.payload,
        selectedPath: [],
        currentWord: '',
        validationError: null,
      };

    case 'LOAD_GRID_FROM_ROOM':
      return {
        ...state,
        grid: action.payload.grid,
        gridSize: action.payload.gridSize,
        selectedPath: [],
        currentWord: '',
        validationError: null,
      };

    case 'SELECT_TILE':
      const newPath = [...state.selectedPath, action.payload];
      const newWord = newPath.map(pos => state.grid[pos.row]?.[pos.col] || '').join('');
      return {
        ...state,
        selectedPath: newPath,
        currentWord: newWord,
        validationError: null,
      };
      
    case 'SET_CURRENT_WORD':
      return {
        ...state,
        currentWord: action.payload,
        validationError: null,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedPath: [],
        currentWord: '',
        validationError: null,
      };

    case 'SET_VALIDATING':
      return {
        ...state,
        isValidating: action.payload,
      };

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationError: action.payload,
        isValidating: false,
      };

    default:
      return state;
  }
}

// Context
const GamePlayContext = createContext<GamePlayContextValue | null>(null);

// Provider component
export interface GamePlayProviderProps {
  children: React.ReactNode;
  initialGridSize?: GridSize;
}

export const GamePlayProvider: React.FC<GamePlayProviderProps> = ({ 
  children, 
  initialGridSize = 'small' 
}) => {
  const [state, dispatch] = useReducer(gamePlayReducer, {
    ...initialState,
    gridSize: initialGridSize
  });

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo<GamePlayActions>(() => ({
    setGridSize: (size: GridSize) => {
      dispatch({ type: 'SET_GRID_SIZE', payload: size });
    },

    generateGrid: () => {
      const size = getGridSizeConfig(state.gridSize);
      const grid = generateLetterGrid(size);
      dispatch({ type: 'GENERATE_GRID', payload: grid });
    },

    loadGridFromRoom: (grid: string[][], gridSize: GridSize) => {
      dispatch({ type: 'LOAD_GRID_FROM_ROOM', payload: { grid, gridSize } });
    },

    selectTile: (position: GridPosition) => {
      dispatch({ type: 'SELECT_TILE', payload: position });
    },

    setCurrentWord: (word: string) => {
      dispatch({ type: 'SET_CURRENT_WORD', payload: word });
    },

    clearSelection: () => {
      dispatch({ type: 'CLEAR_SELECTION' });
    },

    setValidating: (isValidating: boolean) => {
      dispatch({ type: 'SET_VALIDATING', payload: isValidating });
    },

    setValidationError: (error: string | null) => {
      dispatch({ type: 'SET_VALIDATION_ERROR', payload: error });
    },
  }), [state.gridSize]);

  const contextValue = useMemo<GamePlayContextValue>(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <GamePlayContext.Provider value={contextValue}>
      {children}
    </GamePlayContext.Provider>
  );
};

// Hook to use the context
export const useGamePlay = (): GamePlayContextValue => {
  const context = useContext(GamePlayContext);
  if (!context) {
    throw new Error('useGamePlay must be used within a GamePlayProvider');
  }
  return context;
};
