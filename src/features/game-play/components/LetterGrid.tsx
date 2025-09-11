'use client';

import React from 'react';
import { useGamePlay } from '../contexts/GamePlayContext';
import { useWordPath } from '../hooks/useWordPath';

export const LetterGrid: React.FC = () => {
  const { state } = useGamePlay();
  const { 
    selectTilesForWord,
    isPositionInAnyPath,
    currentWord,
    isValidPath
  } = useWordPath();

  const handleLetterClick = (letter: string) => {
    selectTilesForWord(currentWord + letter);
  };

  const getLetterClass = (row: number, col: number) => {
    const baseClass = "aspect-square border-2 rounded-lg text-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]";
    
    const isInAnyPath = isPositionInAnyPath({ row, col });
    
    if (currentWord.length > 0 && !isValidPath) {
      return `${baseClass} bg-red-100 border-red-300 text-red-700 hover:bg-red-200`;
    }
    
    if (isInAnyPath) {
      return `${baseClass} bg-blue-500 text-white border-blue-600 shadow-lg transform scale-105`;
    }
    
    return `${baseClass} bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:shadow-md`;
  };

  const getGridCols = () => {
    if (!state.grid || state.grid.length === 0) return 'grid-cols-4';
    // Use explicit grid column classes that Tailwind knows about
    switch (state.grid.length) {
      case 4: return 'grid-cols-4';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-4';
    }
  };

  const getMaxWidth = () => {
    if (!state.grid || state.grid.length === 0) return 'max-w-xs';
    if (state.grid.length <= 4) return 'max-w-xs';
    if (state.grid.length <= 6) return 'max-w-sm';
    return 'max-w-sm';
  };

  if (!state.grid || state.grid.length === 0) {
    return (
      <div className={`space-y-4`}>
        <h2 className="text-xl font-semibold text-gray-900 text-center">Letter Grid</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No grid generated yet.</p>
          <p className="text-sm">Select a grid size and generate a new grid to start playing.</p>
        </div>
      </div>
    );
  }

  const handleClear = () => {
    selectTilesForWord('')
  };

  return (
    <div className={`space-y-4`}>
      <h2 className="text-xl font-semibold text-gray-900 text-center">Letter Grid</h2>
      
      <div 
        className={`grid ${getGridCols()} gap-3 ${getMaxWidth()} mx-auto`}
        role="grid"
        aria-label={`${state.gridSize} letter grid`}
      >
        {state.grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              className={getLetterClass(rowIndex, colIndex)}
              onClick={() => handleLetterClick(letter)}
              aria-label={`Letter ${letter} at position ${rowIndex + 1}, ${colIndex + 1}`}
              aria-pressed={isPositionInAnyPath({ row: rowIndex, col: colIndex })}
              tabIndex={0}
            >
              {letter}
            </button>
          ))
        )}
      </div>

      <div className="text-center space-y-3">
        {/* Current Word Display */}
        {currentWord && (
          <div className="text-lg font-mono font-semibold text-gray-700">
            Current word: <span className="text-blue-600">{currentWord}</span>
          </div>
        )}
        
        {/* Instructions */}
        <p className="text-sm text-gray-600">
          Click letters to form words. Only adjacent letters can be selected.
        </p>

        <button
            type="button"
            onClick={handleClear}
            className="btn btn--secondary btn--small"
          >
            Clear
        </button>
      </div>
    </div>
  );
};
