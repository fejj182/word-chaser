'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { LetterGrid } from './LetterGrid';
import { WordInput } from './WordInput';
import { ScoreDisplay } from './ScoreDisplay';
import { GameTimer } from './GameTimer';
import { GameHeader } from './GameHeader';
import { WordValidationResponse } from '../types/word';

interface GameScreenProps {
  roomId: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({ roomId }) => {
  const { currentRoom, leaveRoom, loadRoom } = useRoom();
  const { user } = useAuth();
  const router = useRouter();
  const boardLetters = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P']
  ];

  const currentPlayer = currentRoom?.players.find(p => p.id === user?.uid);

  useEffect(() => {
    loadRoom(roomId);
  }, [roomId]);

  // Redirect to lobby if room is not in playing status
  useEffect(() => {
    if (currentRoom && currentRoom.status !== 'playing' && currentPlayer) {
      router.push('/');
    }
  }, [currentRoom, router, currentPlayer]);

  const handleWordSubmitted = useCallback((result: WordValidationResponse) => {
    // Handle successful word submission
    // This could update scores, trigger animations, etc.
    console.log('Word submitted:', result);
  }, []);

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
        <div className="page--content-container">
          <div className="card p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Timer and Score */}
              <div className="lg:col-span-1 space-y-4">
                <GameTimer />
                <ScoreDisplay />
              </div>
              
              {/* Center Column - Letter Grid */}
              <div className="lg:col-span-1">
                <LetterGrid 
                  letters={boardLetters}
                />
              </div>
              
              {/* Right Column - Word Input */}
              <div className="lg:col-span-1">
                <WordInput 
                  boardLetters={boardLetters}
                  onWordSubmitted={handleWordSubmitted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
