'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/guest-auth/hooks/useAuth';
import { updatePlayerReady, startGame } from '@/lib/firebase/room-utils';
import { Room, PartialRoom } from '@/features/room-management/types/room';

// Type guard to check if we have a complete room object
function isCompleteRoom(room: Room | PartialRoom): room is Room {
  return 'players' in room && 'name' in room;
}

const RoomLobby: React.FC = () => {
  const { currentRoom, leaveRoom, isLoading } = useRoom();
  const { user } = useAuth();
  const [startGameError, setStartGameError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  if (!currentRoom || !user) {
    return null;
  }

  // Wait for complete room data before rendering
  if (!isCompleteRoom(currentRoom)) {
    return null;
  }

  const currentPlayer = currentRoom.players.find(p => p.id === user.uid);
  const isHost = currentPlayer?.isHost || false;
  const allPlayersReady = currentRoom.players.every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady && currentRoom.players.length >= 2;

  const handleReadyToggle = async () => {
    if (!currentPlayer) return;
    
    try {
      await updatePlayerReady(currentRoom.id, user.uid, !currentPlayer.isReady);
    } catch (error) {
      console.error('Failed to update ready status:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      setStartGameError(null);
      await startGame(currentRoom.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      console.error('Failed to start game:', error);
      setStartGameError(errorMessage);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const readyCount = currentRoom.players.filter(p => p.isReady).length;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg" aria-busy={isLoading}>
      {/* Room Header */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{currentRoom.name}</h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-gray-600">
              <p className="text-gray-600">
                Room Code: <code className="bg-gray-100 px-2 py-1 rounded">{currentRoom.id}</code>
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded transition-colors"
                aria-label="Copy room code"
                title="Copy room code"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              {isHost && (
                <span className="ml-1 inline-flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  You are the host
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Players ({currentRoom.players.length}/{currentRoom.maxPlayers})</h3>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{readyCount}/{currentRoom.players.length} ready</span>
            {!allPlayersReady && <span>Waiting for players…</span>}
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
            <div
              className={`h-full bg-green-500 transition-all`}
              style={{ width: `${(readyCount / currentRoom.players.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {currentRoom.players.map((player) => (
            <div
              key={player.id}
              data-testid={`player-row-${player.id}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                player.id === user.uid ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{player.displayName}</span>
                  {player.isHost && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {player.isReady ? (
                  <span className="text-green-600 text-sm">Ready</span>
                ) : (
                  <span className="text-gray-500 text-sm">Not Ready</span>
                )}
                {player.id === user.uid && (
                  <button
                    onClick={handleReadyToggle}
                    disabled={isLoading}
                    aria-pressed={player.isReady}
                    className={`px-3 py-1 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      player.isReady
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                    }`}
                  >
                    {player.isReady ? 'Not Ready' : 'Ready'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Game Settings</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Round Duration:</span>
            <span className="ml-2 font-medium">{currentRoom.settings.roundDuration} seconds</span>
          </div>
          <div>
            <span className="text-gray-600">Max Rounds:</span>
            <span className="ml-2 font-medium">{currentRoom.settings.maxRounds}</span>
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      {isHost && (
        <div className="border-t pt-4">
          {startGameError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert" aria-live="assertive">
              {startGameError}
            </div>
          )}
          <button
            onClick={handleStartGame}
            disabled={!canStartGame || isLoading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Game
          </button>
          {!allPlayersReady && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Waiting for all players to be ready...
            </p>
          )}
          {currentRoom.players.length < 2 && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Need at least 2 players to start the game
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomLobby;
