'use client';

import React, { useEffect } from 'react';
import { WordGridDemo } from './WordGridDemo';
import { useGamePlay } from '../../game-play/contexts/GamePlayContext';
import { GridSize } from '../../game-play/contexts/GamePlayContext';

interface WordGridDemoWithControlsProps {
  gridSize: GridSize;
}

/**
 * Enhanced WordGridDemo that responds to external grid size changes
 * This component automatically regenerates the grid when the size changes
 */
export const WordGridDemoWithControls: React.FC<WordGridDemoWithControlsProps> = ({ 
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

  return <WordGridDemo />;
};
