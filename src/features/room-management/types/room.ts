import { GridSize } from "@/features/game-play/contexts/GamePlayContext";

export interface Room {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<string, Player>;
  maxPlayers: number;
  settings: RoomSettings;
  gameData?: {
    grid: string[][];
    currentRound?: number;
  };
}

export interface Player {
  displayName: string;
  joinedAt: number;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wordsFound: number;
}

export interface RoomSettings {
  roundDuration: number; // in seconds
  maxRounds: number;
  gridSize: GridSize;
}

export interface CreateRoomParams {
  maxPlayers: number;
  settings: RoomSettings;
}

export interface RoomState {
  currentRoom: Room | null;
  roomId: string | null;
  isLoading: boolean;
  error: string | null;
} 