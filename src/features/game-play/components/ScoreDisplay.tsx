'use client';

import React from 'react';

export const ScoreDisplay: React.FC = () => {
  // Placeholder score data
  const score = 1250;
  const wordsFound = 8;
  const longestWord = 'EXAMPLE';

  return (
    <div className="space-y-4">
      <h2 className="text--section-title">Your Score</h2>
      
      <div className="space-y-3">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{score}</div>
          <div className="text-sm text-blue-700">Total Points</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{wordsFound}</div>
            <div className="text-xs text-green-700">Words Found</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{longestWord.length}</div>
            <div className="text-xs text-purple-700">Longest Word</div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-1">Longest Word</div>
          <div className="font-mono text-gray-800">{longestWord}</div>
        </div>
      </div>
    </div>
  );
};
