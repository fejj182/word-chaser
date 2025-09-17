'use client';

import React, { useMemo } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { Player } from '@/features/room-management/types/room';

interface PlayerScore extends Player {
  userId: string;
  isCurrentPlayer: boolean;
}

export const RealTimeScoreboard: React.FC = () => {
  const { currentRoom } = useRoom();
  const { user } = useAuth();

  const sortedPlayers = useMemo((): PlayerScore[] => {
    if (!currentRoom || !user) {
      return [];
    }

    return Object.entries(currentRoom.players)
      .map(([userId, player]) => ({
        ...player,
        userId,
        isCurrentPlayer: userId === user.uid,
      }))
      .sort((a, b) => {
        // Sort by score (descending), then by words found (descending), then by join time (ascending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.wordsFound !== a.wordsFound) {
          return b.wordsFound - a.wordsFound;
        }
        return a.joinedAt - b.joinedAt;
      });
  }, [currentRoom, user]);

  if (!currentRoom || sortedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="card p-4" role="region" aria-label="Live scoreboard">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Live Scores
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isLeader = index === 0 && player.score > 0;
          const isCurrentPlayer = player.isCurrentPlayer;
          
          return (
            <div
              key={player.userId}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-colors
                ${isCurrentPlayer 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }
                ${isLeader ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''}
              `}
              role="listitem"
              aria-label={`${player.displayName} - ${player.score} points, ${player.wordsFound} words`}
            >
              <div className="flex items-center gap-3">
                {/* Rank indicator */}
                <div className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${isLeader 
                    ? 'bg-yellow-400 text-yellow-900' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}>
                  {index + 1}
                </div>
                
                {/* Player name */}
                <div className="flex items-center gap-2">
                  <span className={`
                    font-medium
                    ${isCurrentPlayer 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-800 dark:text-gray-200'
                    }
                  `}>
                    {player.displayName}
                  </span>
                  {isCurrentPlayer && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                  {isLeader && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                      🏆 Leader
                    </span>
                  )}
                </div>
              </div>
              
              {/* Score and words */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-mono font-bold text-lg text-gray-800 dark:text-gray-200">
                    {player.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    points
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-gray-600 dark:text-gray-400">
                    {player.wordsFound}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    words
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary stats */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Total words found: {sortedPlayers.reduce((sum, p) => sum + p.wordsFound, 0)}
          </span>
          <span>
            Total points: {sortedPlayers.reduce((sum, p) => sum + p.score, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
