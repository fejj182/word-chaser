'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { useGamePlay } from '../contexts/GamePlayContext';
import { LetterGrid } from './LetterGrid';
import { WordInput } from './WordInput';
import { ScoreDisplay } from './ScoreDisplay';
import { GameTimer } from './GameTimer';
import { GameHeader } from './GameHeader';
import { RealTimeScoreboard } from './RealTimeScoreboard';
import { RoundResults } from './RoundResults';
import { FinalGameResults } from './FinalGameResults';

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
  }, [currentRoom?.gameData?.grid, currentRoom?.settings?.gridSize]);

  const handleLeaveGame = useCallback(async () => {
    try {
      await leaveRoom();
      router.push('/');
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  }, [leaveRoom, router]);

  // Redirect to lobby if room is not in playing or finished status
  useEffect(() => {
    if (currentRoom && !['playing', 'finished'].includes(currentRoom.status) && currentPlayer) {
      router.push('/');
    }
  }, [currentRoom, router, currentPlayer]);

  // Handle browser close/refresh during active game
  useEffect(() => {
    if (!currentRoom?.id || !user?.uid) {
      return;
    }

    const handleBeforeUnload = () => {
      if (currentRoom?.id && user?.uid) {
        // Use sendBeacon for reliable cleanup on page unload
        const data = JSON.stringify({
          roomId: currentRoom.id,
          userId: user.uid
        });
        
        try {
          navigator.sendBeacon('/api/leave-room', data);
        } catch (error) {
          console.warn('Failed to send cleanup request:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentRoom?.id, user?.uid]);

  // Handle browser back button during active game
  useEffect(() => {
    // Only add listener when game is actually playing
    if (currentRoom?.status !== 'playing') {
      return;
    }

    const handlePopState = () => {
      const shouldLeave = window.confirm('Are you sure you want to leave the game?');
      if (shouldLeave) {
        handleLeaveGame();
      } else {
        // Push state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentRoom?.status, handleLeaveGame]);


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
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
            {/* Main Game Area */}
            <div className="xl:col-span-4 space-y-4">
              {/* Compact Status Bar */}
              <div className="flex items-center justify-between px-2 py-2 rounded bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700" role="region" aria-label="Round status bar">
                <GameTimer />
                <ScoreDisplay />
              </div>

              {/* Game Interaction */}
              <div className="card p-6" role="region" aria-label="Game interaction">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Letter Grid */}
                  <div className="lg:col-span-1">
                    <LetterGrid />
                  </div>
                  
                  {/* Word Input */}
                  <div className="lg:col-span-1">
                    <WordInput/>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar - Real-time Scoreboard */}
            <div className="xl:col-span-2">
              <div className="sticky top-6">
                <RealTimeScoreboard />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <RoundResults />
      <FinalGameResults />
    </div>
  );
};
