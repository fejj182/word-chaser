import React from 'react';
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';
import { UserProvider } from '@/features/user-management/contexts/UserContext';
import { RoomProvider } from '@/features/room-management/contexts/RoomContext';

export const AllProvidersDecorator = (Story: React.ComponentType) => (
  <UserProvider>
    <RoomProvider>
      <GamePlayProvider>
        <Story />
      </GamePlayProvider>
    </RoomProvider>
  </UserProvider>
);

export const GamePlayDecorator = (Story: React.ComponentType) => (
  <GamePlayProvider>
    <Story />
  </GamePlayProvider>
);

export const UserRoomDecorator = (Story: React.ComponentType) => (
  <UserProvider>
    <RoomProvider>
      <Story />
    </RoomProvider>
  </UserProvider>
);
