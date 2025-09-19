'use client';

import React from 'react';
import { useGameTimer } from '../hooks/useGameTimer';

export const GameTimer: React.FC = () => {
  const { timeLeft, isTimerRunning, currentRound } = useGameTimer();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm" role="region" aria-label="Timer">
      <span className="text-gray-600">Round {currentRound}</span>
      <span className="text-gray-600">•</span>
      <span className="text-gray-600">Time</span>
      <span 
        className={`font-mono px-2 py-0.5 rounded ${
          timeLeft <= 30 && isTimerRunning 
            ? 'bg-red-100 text-red-700' 
            : 'bg-gray-100 text-gray-700'
        }`} 
        aria-live={timeLeft <= 30 && isTimerRunning ? 'assertive' : 'polite'}
      >
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};
