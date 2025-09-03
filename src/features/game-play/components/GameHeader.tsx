'use client';

import React from 'react';

interface GameHeaderProps {
  roomName: string;
  playerName: string;
  onLeaveGame: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ 
  roomName, 
  playerName, 
  onLeaveGame 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text--title">Word Chaser</h1>
        <div className="text-sm text-gray-600">
          Room: <span className="font-mono">{roomName}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          Playing as: <span className="font-medium">{playerName}</span>
        </div>
        <button
          type="button"
          onClick={onLeaveGame}
          className="btn btn--danger btn--small"
          aria-label="Leave game"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};
