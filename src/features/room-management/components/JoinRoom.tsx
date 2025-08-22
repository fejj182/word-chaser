'use client';

import React, { useState } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import JoinRoomUI from './JoinRoomUI';

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
    <JoinRoomUI
      roomId={roomId}
      isLoading={isLoading}
      error={error}
      onRoomIdChange={setRoomId}
      onSubmit={handleSubmit}
    />
  );
};

export default JoinRoom;
