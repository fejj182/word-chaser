'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';

const RoomLobby: React.FC = () => {
  const { currentRoom, leaveRoom, isLoading, updatePlayerReady, startGame } = useRoom();
  const { user } = useAuth();
  const [startGameError, setStartGameError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  if (!currentRoom || !user) {
    return null;
  }

  const currentPlayer = currentRoom.players[user.uid];
  const isHost = currentPlayer?.isHost || false;
  const allPlayersReady = Object.values(currentRoom.players).every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady && Object.keys(currentRoom.players).length >= 2;

  const handleReadyToggle = async () => {
    if (!currentPlayer) return;
    
    try {
      await updatePlayerReady(!currentPlayer.isReady);
    } catch (error) {
      console.error('Failed to update ready status:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      setStartGameError(null);
      await startGame();
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
      await navigator.clipboard.writeText(currentRoom.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const readyCount = Object.values(currentRoom.players).filter(p => p.isReady).length;

  return (
    <div className="card card--lobby" aria-busy={isLoading}>
      {/* Room Header */}
      <div className="section--divider">
        <div className="layout--flex-between items-start">
          <div className="min-w-0 flex-1">
            <h2 className="text--room-title mb-3">Lobby</h2>
            <div className="flex items-center space-x-3 mb-2">
              <code 
                data-testid="room-code"
                className="text-lg font-mono bg-gray-100 px-3 py-2 rounded border flex-1"
              >
                {currentRoom.name}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn--secondary btn--small whitespace-nowrap"
                aria-label="Copy room code"
                title="Copy room code to share with friends"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <p className="text-sm text-gray-600">
                Share this code with friends to invite them to your room
              </p>
              {isHost && (
                <span 
                  data-testid="host-badge"
                  className="inline-flex items-center badge badge--host"
                >
                  You are the host
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            disabled={isLoading}
            className="btn btn--danger btn--medium ml-4 opacity-75 hover:opacity-100"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="spacing--section">
        <h3 className="text--section-title mb-2" data-testid="players-count">Players ({Object.keys(currentRoom.players).length}/{currentRoom.maxPlayers})</h3>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{readyCount}/{Object.keys(currentRoom.players).length} ready</span>
            {!allPlayersReady && <span>Waiting for players…</span>}
          </div>
          <div className="progress-bar" aria-hidden="true">
                          <div
                className="progress-bar--fill"
                style={{ width: `${(readyCount / Object.keys(currentRoom.players).length) * 100}%` }}
              />
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(currentRoom.players).map(([playerId, player]) => (
            <div
              key={playerId}
              data-testid={`player-row-${playerId}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                playerId === user.uid ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="layout--flex-center-3">
                <div className="layout--flex-center-2">
                  <span className="text--player-name">{player.displayName}</span>
                  {player.isHost && (
                    <span className="badge badge--host">
                      Host
                    </span>
                  )}
                </div>
              </div>
              <div className="layout--flex-center-2">
                {player.isReady ? (
                  <span className="text--status-ready">Ready</span>
                ) : (
                  <span className="text--status-not-ready">Not Ready</span>
                )}
                {playerId === user.uid && (
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
      <div className="spacing--section">
        <h3 className="text--section-title">Game Settings</h3>
        <div className="layout--grid-settings">
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
        <div className="section--divider-top">
          {startGameError && (
            <div className="form-error" role="alert" aria-live="assertive">
              {startGameError}
            </div>
          )}
                  <button
          onClick={handleStartGame}
          disabled={!canStartGame || isLoading}
          className="btn btn--secondary btn--full btn--large btn--disabled"
        >
          Start Game
        </button>
          {!allPlayersReady && (
            <p className="text--info">
              Waiting for all players to be ready...
            </p>
          )}
          {Object.keys(currentRoom.players).length < 2 && (
            <p className="text--info">
              Need at least 2 players to start the game
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomLobby;
