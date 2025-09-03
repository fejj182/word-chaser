'use client';

import React from 'react';

export const LetterGrid: React.FC = () => {
  // Placeholder letters for the grid
  const letters = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P']
  ];

  return (
    <div className="space-y-4">
      <h2 className="text--section-title text-center">Letter Grid</h2>
      <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
        {letters.flat().map((letter, index) => (
          <button
            key={index}
            type="button"
            className="aspect-square bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded-lg text-2xl font-bold text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Select letter ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 text-center">
        Click letters to form words
      </p>
    </div>
  );
};
