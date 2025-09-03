'use client';

import React, { useState, useEffect } from 'react';

export const GameTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((180 - timeLeft) / 180) * 100;

  return (
    <div className="space-y-4">
      <h2 className="text--section-title">Time Remaining</h2>
      
      <div className="space-y-3">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className={`text-4xl font-bold ${timeLeft <= 30 ? 'text-red-600' : 'text-red-500'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-red-700">
            {timeLeft <= 30 ? 'Hurry up!' : 'Round in progress'}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar--fill bg-red-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {!isActive && timeLeft === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-sm font-medium text-yellow-800">
              Time's up! Round complete.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
