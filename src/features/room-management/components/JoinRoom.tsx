'use client';

import React, { useState } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import JoinRoomUI from './JoinRoomUI';
import { useUser } from '@/features/user-management/contexts/UserContext';

const JoinRoom: React.FC = () => {
  const { joinRoom, isLoading, error, clearError } = useRoom();
  const [roomId, setRoomId] = useState('');
  const { displayName } = useUser();
  const [alias, setAlias] = useState<string>(displayName || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim() || !alias.trim()) {
      return;
    }

    try {
      clearError();
      await joinRoom(roomId.trim(), alias.trim());
      // Success will be handled by the room context subscription
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to join room:', error);
    }
  };

  return (
    <JoinRoomUI
      roomId={roomId}
      alias={alias}
      isLoading={isLoading}
      error={error}
      onRoomIdChange={setRoomId}
      onAliasChange={setAlias}
      onSubmit={handleSubmit}
    />
  );
};

export default JoinRoom;
