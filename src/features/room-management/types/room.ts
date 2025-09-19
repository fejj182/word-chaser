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
    submittedWords?: Record<string, SubmittedWord>;
    roundStartTime?: number;
    roundEndTime?: number;
    timerStatus?: 'running' | 'paused' | 'ended';
    roundResults?: Record<number, RoundResult>;
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

export interface SubmittedWord {
  word: string;
  playerId: string;
  playerName: string;
  score: number;
  submittedAt: number;
}

export interface RoundResult {
  roundNumber: number;
  roundScores: Record<string, number>;
  roundWords: Record<string, SubmittedWord[]>;
  roundWinner: {
    playerId: string;
    playerName: string;
    score: number;
  } | null;
}

export interface RoomState {
  currentRoom: Room | null;
  roomId: string | null;
  isLoading: boolean;
  error: string | null;
} 