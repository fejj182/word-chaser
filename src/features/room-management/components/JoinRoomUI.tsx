'use client';

import React from 'react';

interface JoinRoomUIProps {
  roomId: string;
  isLoading: boolean;
  error?: string | null;
  onRoomIdChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const JoinRoomUI: React.FC<JoinRoomUIProps> = ({
  roomId,
  isLoading,
  error = null,
  onRoomIdChange,
  onSubmit,
}) => {
  return (
    <div className="card card--form">
      <h2 className="text--card-title">
        Join a Room
      </h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="spacing--form">
        <div>
          <label htmlFor="roomId" className="form-label">
            Room Code
          </label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => onRoomIdChange(e.target.value)}
            className="form-input"
            placeholder="Enter room code..."
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !roomId.trim()}
          className="btn btn--primary btn--full btn--medium btn--disabled"
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default JoinRoomUI;



