'use client';

import React, { useState } from 'react';
import { WordGridDemoWithControls } from '@/features/guest-auth/components/WordGridDemoWithControls';
import { GridDebugControls } from '@/features/guest-auth/components/GridDebugControls';
import { GridSizeSelector } from '@/features/game-play/components/GridSizeSelector';
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';
import { GridSize } from '@/features/game-play/contexts/GamePlayContext';

/**
 * Demo page for debugging grid-related issues
 * Features:
 * - Grid size selection (4x4, 6x6)
 * - Regenerate grid button
 * - Grid quality validation
 * - Complete WordGridDemo integration
 */
export default function DemoPage() {
  const [gridSize, setGridSize] = useState<GridSize>('small');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grid Debug Demo
          </h1>
          <p className="text-gray-600">
            Development tool for testing and debugging grid-related functionality
          </p>
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debug Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grid Size Selector */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Grid Configuration
              </h3>
              <GridSizeSelector
                value={gridSize}
                onChange={setGridSize}
                className="mb-4"
              />
              <p className="text-sm text-gray-600">
                Current size: {gridSize === 'small' ? '4×4' : '6×6'} grid
              </p>
            </div>

            {/* Debug Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Debug Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Grid Size:</span>
                  <span className="font-mono">{gridSize === 'small' ? '4×4' : '6×6'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tiles:</span>
                  <span className="font-mono">{gridSize === 'small' ? '16' : '36'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generation Method:</span>
                  <span className="font-mono">Boggle Dice</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Word Grid Demo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Interactive Grid Demo
            </h2>
            <p className="text-gray-600 mt-1">
              Full-featured word grid with real-time validation and pathfinding
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <GamePlayProvider initialGridSize={gridSize}>
              <GridDebugControls />
              <WordGridDemoWithControls gridSize={gridSize} />
            </GamePlayProvider>
          </div>
        </div>

        {/* Development Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Development Notes
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Grid Generation:</strong> Uses Boggle-style dice distributions for balanced letter frequency.
            </p>
            <p>
              <strong>Pathfinding:</strong> Supports 8-directional movement with adjacency validation.
            </p>
            <p>
              <strong>Word Validation:</strong> Real-time dictionary lookup with minimum 3-letter words.
            </p>
            <p>
              <strong>Accessibility:</strong> Full keyboard navigation and screen reader support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
