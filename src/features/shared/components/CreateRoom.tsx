'use client';

import React from 'react';
import { useRoom } from '@/features/shared/contexts/RoomContext';
import { CreateRoomParams } from '@/features/shared/types/room';
import CreateRoomForm from './CreateRoomForm';

const CreateRoom: React.FC = () => {
  const { createRoom, isLoading, error, clearError } = useRoom();

  const handleCreateRoom = async (params: CreateRoomParams) => {
    try {
      clearError();
      await createRoom(params);
      // Room creation successful - RoomManager will automatically show the lobby
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to create room:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Create a New Room
      </h2>
      
      {error && (
        <div data-testid="error" className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <CreateRoomForm onSubmit={handleCreateRoom} isLoading={isLoading} />
    </div>
  );
};

export default CreateRoom;
