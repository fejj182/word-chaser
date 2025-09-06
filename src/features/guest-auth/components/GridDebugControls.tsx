'use client';

import React from 'react';
import { useGamePlay } from '../../game-play/contexts/GamePlayContext';
import { validateGridQuality } from '@/lib/utils/grid-generation';

/**
 * Debug controls for grid testing and analysis
 * Provides regenerate button and grid quality metrics
 */
export const GridDebugControls: React.FC = () => {
  const { state, actions } = useGamePlay();

  const handleRegenerateGrid = () => {
    actions.generateGrid();
  };

  const gridQuality = validateGridQuality(state.grid, 5);
  const totalTiles = state.grid.length * (state.grid[0]?.length || 0);
  const uniqueLetters = new Set(state.grid.flat()).size;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-3">
        Grid Debug Controls
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controls */}
        <div>
          <button
            onClick={handleRegenerateGrid}
            className="btn btn-primary mb-3"
            aria-label="Generate a new random grid"
          >
            🎲 Regenerate Grid
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Click to generate a new random grid with the current size.</p>
          </div>
        </div>

        {/* Grid Statistics */}
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Grid Statistics</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-mono">{state.gridSize === 'small' ? '4×4' : '6×6'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tiles:</span>
              <span className="font-mono">{totalTiles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unique Letters:</span>
              <span className="font-mono">{uniqueLetters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality:</span>
              <span className={`font-mono ${gridQuality ? 'text-green-600' : 'text-orange-600'}`}>
                {gridQuality ? 'Good' : 'Fair'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Grid Preview */}
      {state.grid.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-800 mb-2">Current Grid</h4>
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="font-mono text-sm leading-tight">
              {state.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center">
                  {row.map((letter, colIndex) => (
                    <span 
                      key={`${rowIndex}-${colIndex}`}
                      className="inline-block w-6 text-center"
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
