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

  if (currentRoom) {
    return <RoomLobby />;
  }

  if (view === 'menu') {
    return (
      <RoomMenuUI
        onCreate={() => setView('create')}
        onJoin={() => setView('join')}
      />
    );
  }

  if (view === 'create') {
    return (
      <div>
        <button
          onClick={() => setView('menu')}
          className="btn btn--back"
        >
          ← Back to Menu
        </button>
        <CreateRoom />
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div>
        <button
          onClick={() => setView('menu')}
          className="btn btn--back"
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
