'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { CreateRoomParams } from '@/features/room-management/types/room';
import CreateRoomUI from './CreateRoomUI';

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
      
      <CreateRoomUI onSubmit={handleCreateRoom} isLoading={isLoading} error={error} />
    </div>
  );
};

export default CreateRoom;
