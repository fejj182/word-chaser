'use client';

import React, { useState, useCallback } from 'react';

export interface LetterGridProps {
  letters: string[][];
}

export const LetterGrid: React.FC<LetterGridProps> = ({ 
  letters 
}) => {
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());

  const handleLetterClick = useCallback((row: number, col: number) => {
    // Toggle letter selection
    const newSelected = new Set(selectedLetters);
    const posKey = `${row},${col}`;
    
    if (newSelected.has(posKey)) {
      newSelected.delete(posKey);
    } else {
      newSelected.add(posKey);
    }
    
    setSelectedLetters(newSelected);
    
  }, [letters, selectedLetters]);

  const isSelected = useCallback((row: number, col: number) => {
    return selectedLetters.has(`${row},${col}`);
  }, [selectedLetters]);

  const getLetterClass = useCallback((row: number, col: number) => {
    const baseClass = "aspect-square border-2 rounded-lg text-2xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    if (isSelected(row, col)) {
      return `${baseClass} bg-blue-500 text-white border-blue-600`;
    }
    
    return `${baseClass} bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800`;
  }, [isSelected]);

  return (
    <div className="space-y-4">
      <h2 className="text--section-title text-center">Letter Grid</h2>
      <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
        {letters.flat().map((letter, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          
          return (
            <button
              key={index}
              type="button"
              className={getLetterClass(row, col)}
              onClick={() => handleLetterClick(row, col)}
              aria-label={`Select letter ${letter} at position ${row + 1}, ${col + 1}`}
              aria-pressed={isSelected(row, col)}
            >
              {letter}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 text-center">
        Click letters to form words
      </p>
      <div className="text-xs text-gray-500 text-center">
        {selectedLetters.size > 0 && (
          <span>Selected: {selectedLetters.size} letter{selectedLetters.size !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};
