'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { LetterGrid } from './LetterGrid';
import { WordInput } from './WordInput';
import { ScoreDisplay } from './ScoreDisplay';
import { GameTimer } from './GameTimer';
import { GameHeader } from './GameHeader';
import { Room } from '@/features/room-management/types/room';

interface GameScreenProps {
  roomId: string;
}

function isCompleteRoom(room: Room): room is Room {
  return 'players' in room && 'name' in room && 'status' in room;
}

export const GameScreen: React.FC<GameScreenProps> = ({ roomId }) => {
  const { currentRoom, leaveRoom, loadRoom } = useRoom();
  const { user } = useAuth();
  const router = useRouter();

  const currentPlayer = currentRoom?.players.find(p => p.id === user?.uid);

  useEffect(() => {
    loadRoom(roomId);
  }, [roomId])

  // Redirect to lobby if room is not in playing status
  useEffect(() => {
    if (currentRoom && isCompleteRoom(currentRoom) && currentRoom.status !== 'playing' && currentPlayer) {
      router.push('/');
    }
  }, [currentRoom, router]);

  if (!currentRoom || !user || !currentPlayer) {
    return null;
  }

  const handleLeaveGame = async () => {
    try {
      await leaveRoom();
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  };

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
                <LetterGrid />
              </div>
              
              {/* Right Column - Word Input */}
              <div className="lg:col-span-1">
                <WordInput />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
