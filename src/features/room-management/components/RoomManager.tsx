'use client';

import React, { useState } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import RoomMenuUI from './RoomMenuUI';
import RoomLobby from './RoomLobby';

type RoomView = 'menu' | 'create' | 'join';

const RoomManager: React.FC = () => {
  const { currentRoom } = useRoom();
  const [view, setView] = useState<RoomView>('menu');

  // If user is in a room, show the lobby
  if (currentRoom) {
    return <RoomLobby />;
  }

  // Show the main menu
  if (view === 'menu') {
    return (
      <RoomMenuUI
        onCreate={() => setView('create')}
        onJoin={() => setView('join')}
      />
    );
  }

  // Show create room form
  if (view === 'create') {
    return (
      <div>
        <button
          onClick={() => setView('menu')}
          className="mb-4 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Back to Menu
        </button>
        <CreateRoom />
      </div>
    );
  }

  // Show join room form
  if (view === 'join') {
    return (
      <div>
        <button
          onClick={() => setView('menu')}
          className="mb-4 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ← Back to Menu
        </button>
        <JoinRoom />
      </div>
    );
  }

  return null;
};

export default RoomManager;
