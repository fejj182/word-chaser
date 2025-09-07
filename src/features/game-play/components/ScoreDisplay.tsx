'use client';

import React from 'react';

export const ScoreDisplay: React.FC = () => {
  // Placeholder score data
  const score = 1250;
  const wordsFound = 8;

  return (
    <div className="flex items-center gap-3 text-sm" role="region" aria-label="Score">
      <span className="text-gray-600">Score</span>
      <span className="font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{score}</span>
      <span className="text-gray-400" aria-hidden="true">|</span>
      <span className="text-gray-600">Words</span>
      <span className="font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded">{wordsFound}</span>
    </div>
  );
};
