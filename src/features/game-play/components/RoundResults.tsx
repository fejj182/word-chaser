'use client';

import React, { useState, useEffect } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { RoundResult } from '@/features/room-management/types/room';

export const RoundResults: React.FC = () => {
  const { currentRoom } = useRoom();
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [countdown, setCountdown] = useState(5);

  const currentRound = currentRoom?.gameData?.currentRound;
  const roundResults = currentRoom?.gameData?.roundResults;
  const timerStatus = currentRoom?.gameData?.timerStatus;

  useEffect(() => {
    if (currentRound && roundResults?.[`round-${currentRound}`] && timerStatus === 'ended') {
      setRoundResult(roundResults?.[`round-${currentRound}`]);
      setCountdown(5);
    } else {
      setRoundResult(null);
    }
  }, [roundResults, currentRound, timerStatus]);

  useEffect(() => {
    if (!roundResult) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundResult]);

  if (!roundResult) {
    return null;
  }

  const sortedPlayers = Object.entries(roundResult.roundScores)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Round {roundResult.roundNumber} Results</h2>
        
        <div className="space-y-2 mb-4">
          {sortedPlayers.map(([playerId, score]) => {
            const player = currentRoom?.players?.[playerId];
            if (!player) return null;
            
            return (
              <div key={playerId} className="flex justify-between items-center">
                <span className="font-medium">{player.displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {roundResult.roundWords?.[playerId]?.length || 0} words
                  </span>
                  <span className="font-mono font-bold">{score} pts</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {roundResult.roundWinner && (
          <div className="text-center p-3 bg-yellow-100 rounded mb-4">
            <p className="font-bold text-yellow-800">
              🏆 {roundResult.roundWinner.playerName} wins this round!
            </p>
            <p className="text-sm text-yellow-700">
              {roundResult.roundWinner.score} points
            </p>
          </div>
        )}

        {!roundResult.roundWinner && (
          <div className="text-center p-3 bg-gray-100 rounded mb-4">
            <p className="text-gray-600">No winners this round</p>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Next round starts in {countdown} seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
