'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { useGamePlay } from '../contexts/GamePlayContext';
import { LetterGrid } from './LetterGrid';
import { WordInput } from './WordInput';
import { ScoreDisplay } from './ScoreDisplay';
import { GameTimer } from './GameTimer';
import { GameHeader } from './GameHeader';

interface GameScreenProps {
  roomId: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({ roomId }) => {
  const { currentRoom, leaveRoom, loadRoom } = useRoom();
  const { user } = useAuth();
  const { actions: { loadGridFromRoom } } = useGamePlay();
  const router = useRouter();

  const currentPlayer = user?.uid ? currentRoom?.players[user.uid] : undefined;

  useEffect(() => {
    loadRoom(roomId);
  }, [roomId]);

  // Load grid from room data when room is loaded and has game data
  useEffect(() => {
    if (currentRoom?.gameData?.grid && currentRoom.settings?.gridSize) {
      loadGridFromRoom(currentRoom.gameData.grid, currentRoom.settings.gridSize);
    }
  }, [currentRoom?.status, loadGridFromRoom]);

  // Redirect to lobby if room is not in playing status
  useEffect(() => {
    if (currentRoom && currentRoom.status !== 'playing' && currentPlayer) {
      router.push('/');
    }
  }, [currentRoom, router, currentPlayer]);

  const handleLeaveGame = async () => {
    try {
      await leaveRoom();
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  };

  if (!currentRoom || !user || !currentPlayer) {
    return null;
  }

  return (
    <div className="page">
      <div className="page--header">
        <div className="page--header-container">
          <GameHeader 
            roomName={currentRoom.name}
            playerName={currentPlayer.displayName}
            onLeaveGame={handleLeaveGame}
          />
        </div>
      </div>
      
      <div className="page--content">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {/* Compact Status Bar */}
          <div className="flex items-center justify-between px-2 py-2 rounded bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700" role="region" aria-label="Round status bar">
            <GameTimer />
            <ScoreDisplay />
          </div>

          {/* Main Game Container */}
          <div className="card p-6" role="region" aria-label="Game interaction">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Letter Grid */}
              <div className="lg:col-span-1">
                <LetterGrid />
              </div>
              
              {/* Right Column - Word Input */}
              <div className="lg:col-span-1">
                <WordInput/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
