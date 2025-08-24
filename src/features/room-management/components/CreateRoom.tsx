'use client';

import React from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { CreateRoomParams } from '@/features/room-management/types/room';
import CreateRoomUI from './CreateRoomUI';
import { useUser } from '@/features/guest-auth/contexts/UserContext';

const CreateRoom: React.FC = () => {
  const { createRoom, isLoading, error, clearError } = useRoom();
  const { displayName } = useUser();

  const handleCreateRoom = async (params: CreateRoomParams, alias: string) => {
    try {
      clearError();
      await createRoom(params, alias);
      // Room creation successful - RoomManager will automatically show the lobby
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to create room:', error);
    }
  };

  return (
    <div className="card card--form">
      <h2 className="text--card-title">
        Create a New Room
      </h2>
      
      <CreateRoomUI onSubmit={handleCreateRoom} isLoading={isLoading} error={error} initialAlias={displayName || ''} />
    </div>
  );
};

export default CreateRoom;
