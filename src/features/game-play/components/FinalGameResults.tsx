'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useRouter } from 'next/navigation';
import { FinalGameResultsUI } from './FinalGameResults/FinalGameResultsUI';
import { RoundResult } from '@/features/room-management/types/room';

export const FinalGameResults: React.FC = () => {
  const { currentRoom } = useRoom();
  const router = useRouter();

  if (!currentRoom || currentRoom.status !== 'finished') {
    return null;
  }

  const gameWinner = currentRoom.gameData?.gameWinner;
  const players = currentRoom.players;
  const roundResults = currentRoom.gameData?.roundResults;

  const handleReturnToMenu = () => {
    router.push('/');
  };

  const sortedPlayers = Object.entries(players)
    .map(([playerId, player]) => ({
      playerId,
      ...player
    }))
    .sort((a, b) => b.score - a.score);

  const getTotalWordsFound = (playerId: string): number => {
    if (!roundResults) return 0;
    
    return Object.values(roundResults).reduce((total, roundResult) => {
      return total + (roundResult.roundWords?.[playerId]?.length || 0);
    }, 0);
  };

  return (
    <FinalGameResultsUI
      gameWinner={gameWinner}
      sortedPlayers={sortedPlayers}
      roundResults={roundResults as Record<string, RoundResult> | undefined}
      players={players}
      onReturnToMenu={handleReturnToMenu}
      getTotalWordsFound={getTotalWordsFound}
    />
  );
};
