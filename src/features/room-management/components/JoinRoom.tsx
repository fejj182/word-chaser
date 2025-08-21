'use client';

import React, { useState } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

const JoinRoom: React.FC = () => {
  const { joinRoom, isLoading, error, clearError } = useRoom();
  const [roomId, setRoomId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      return;
    }

    try {
      clearError();
      await joinRoom(roomId.trim());
      // Success will be handled by the room context subscription
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to join room:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Join a Room
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
            Room Code
          </label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter room code..."
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !roomId.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;
