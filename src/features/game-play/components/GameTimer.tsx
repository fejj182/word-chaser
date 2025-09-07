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

  return (
    <div className="flex items-center gap-2 text-sm" role="region" aria-label="Timer">
      <span className="text-gray-600">Time</span>
      <span className={`font-mono px-2 py-0.5 rounded ${timeLeft <= 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`} aria-live={timeLeft <= 30 ? 'assertive' : 'polite'}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};
