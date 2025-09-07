'use client';

import React, { useEffect } from 'react';
import { useGamePlay } from '@/features/game-play/contexts/GamePlayContext';
import { GridSize } from '@/features/game-play/contexts/GamePlayContext';
import { WordInput } from '@/features/game-play/components/WordInput';
import { LetterGrid } from '@/features/game-play/components/LetterGrid';

interface WordGridDemoProps {
  gridSize: GridSize;
}

/**
 * Enhanced WordGridDemo that responds to external grid size changes
 * This component automatically regenerates the grid when the size changes
 */
export const WordGridDemo: React.FC<WordGridDemoProps> = ({ 
  gridSize 
}) => {
  const { state, actions } = useGamePlay();

  // Update grid size when prop changes
  useEffect(() => {
    if (state.gridSize !== gridSize) {
      actions.setGridSize(gridSize);
    }
  }, [gridSize, state.gridSize, actions]);

  // Regenerate grid when size changes
  useEffect(() => {
    actions.generateGrid();
  }, [state.gridSize, actions]);

  return (
    <div className={`max-w-4xl mx-auto p-6`}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <LetterGrid />
        <WordInput />
      </div>
    </div>
  );
};
