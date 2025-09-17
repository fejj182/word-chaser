'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';

export const ScoreDisplay: React.FC = () => {
  const { currentRoom } = useRoom();
  const { user } = useAuth();
  
  const currentPlayer = user && currentRoom ? currentRoom.players[user.uid] : null;
  const score = currentPlayer?.score ?? 0;
  const wordsFound = currentPlayer?.wordsFound ?? 0;

  return (
    <div className="flex items-center gap-2 text-sm" role="region" aria-label="Your current score">
      <span className="text-gray-600 dark:text-gray-400">Your Score:</span>
      <span className="font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
        {score}
      </span>
      <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">•</span>
      <span className="font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs">
        {wordsFound} words
      </span>
    </div>
  );
};
