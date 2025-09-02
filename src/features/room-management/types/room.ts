export interface Room {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  maxPlayers: number;
  settings: RoomSettings;
}

// Partial room state when only the ID is set (during loading)
export interface PartialRoom {
  id: string;
}

export interface Player {
  id: string;
  displayName: string;
  joinedAt: number;
  isHost: boolean;
  isReady: boolean;
}

export interface RoomSettings {
  roundDuration: number; // in seconds
  maxRounds: number;
}

export interface CreateRoomParams {
  maxPlayers: number;
  settings: RoomSettings;
}

export interface RoomState {
  currentRoom: Room | PartialRoom | null;
  roomId: string | null;
  isLoading: boolean;
  error: string | null;
} 