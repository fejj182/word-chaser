'use client';

import React, { useState } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
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
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Word Chaser
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setView('create')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Create a New Room
          </button>
          
          <button
            onClick={() => setView('join')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Join Existing Room
          </button>
        </div>
      </div>
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
