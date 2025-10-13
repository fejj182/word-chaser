'use client';

import React from 'react';
import { RoundResult } from '@/features/room-management/types/room';

interface Player {
  playerId: string;
  displayName: string;
  score: number;
}

interface GameWinner {
  playerId: string;
  playerName: string;
  finalScore: number;
}

export interface FinalGameResultsUIProps {
  gameWinner?: GameWinner;
  sortedPlayers: Player[];
  roundResults?: Record<string, RoundResult>;
  players: Record<string, { displayName: string }>;
  onReturnToMenu: () => void;
  getTotalWordsFound: (playerId: string) => number;
}

const getPlayerRank = (index: number): string => {
  switch (index) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    default: return `${index + 1}.`;
  }
};

export const FinalGameResultsUI: React.FC<FinalGameResultsUIProps> = ({
  gameWinner,
  sortedPlayers,
  roundResults,
  players,
  onReturnToMenu,
  getTotalWordsFound,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-label="Final Game Results">
      <div className="card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Complete!</h2>
          <p className="text-gray-600">Final Results</p>
        </div>

        {gameWinner ? (
          <div className="text-center p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg mb-6">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-yellow-800 mb-2">
              {gameWinner.playerName} Wins!
            </h3>
            <p className="text-lg text-yellow-700">
              Final Score: {gameWinner.finalScore} points
            </p>
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-100 rounded-lg mb-6">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              It&apos;s a Tie!
            </h3>
            <p className="text-gray-600">
              No clear winner this game
            </p>
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Final Leaderboard</h4>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const totalWords = getTotalWordsFound(player.playerId);
              const isWinner = gameWinner?.playerId === player.playerId;
              
              return (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    isWinner 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlayerRank(index)}</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {player.displayName}
                        {isWinner && <span className="ml-2 text-yellow-600">👑</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {totalWords} words found
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {player.score} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {roundResults && Object.keys(roundResults).length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Round Summary</h4>
            <div className="space-y-2">
              {Object.values(roundResults).map((roundResult) => (
                <div key={roundResult.roundNumber} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Round {roundResult.roundNumber}</span>
                  <div className="flex gap-4 text-sm">
                    {Object.entries(roundResult.roundScores).map(([playerId, score]) => {
                      const player = players[playerId];
                      return (
                        <span key={playerId} className="text-gray-600">
                          {player?.displayName}: {score} pts
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={onReturnToMenu}
            className="btn btn--secondary btn--medium"
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
