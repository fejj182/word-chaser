'use client';

import React, { useEffect } from 'react';
import { LetterGrid } from '../../game-play/components/LetterGrid';
import { WordInput } from '../../game-play/components/WordInput';
import { useGamePlay } from '../../game-play/contexts/GamePlayContext';

/**
 * Complete word grid demo component that showcases all functionality
 * This component demonstrates:
 * - Grid size selection (4x4, 6x6)
 * - Boggle-style grid generation
 * - Two-way binding between grid and input
 * - Real-time word validation
 * - Pathfinding and highlighting
 * - Accessibility features
 */
export const WordGridDemo: React.FC = () => {
  const { actions } = useGamePlay();

  useEffect(() => {
    actions.generateGrid();
  }, []);

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-8`}>
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How to Play
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Grid Interaction:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click letters to build words</li>
              <li>Letters must be adjacent (including diagonals)</li>
              <li>Each letter can only be used once per word</li>
              <li>Press Backspace to remove the last selected letter</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Typing:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Type words to see them highlighted on the grid</li>
              <li>Real-time validation shows if words are valid</li>
              <li>Minimum 3 letters required</li>
              <li>Submit valid words to add them to your list</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LetterGrid />
        <WordInput />
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">🎲</div>
          <h4 className="font-semibold mb-1">Boggle-Style Generation</h4>
          <p className="text-sm text-gray-600">
            Grids use balanced letter distributions for better word yield
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">🔍</div>
          <h4 className="font-semibold mb-1">Real Dictionary</h4>
          <p className="text-sm text-gray-600">
            Words validated against a comprehensive English dictionary
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">♿</div>
          <h4 className="font-semibold mb-1">Accessible</h4>
          <p className="text-sm text-gray-600">
            Full keyboard navigation and screen reader support
          </p>
        </div>
      </div>
    </div>
  );
};
