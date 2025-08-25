export interface SessionManager {
  // Core session operations
  createSession(params: CreateSessionParams, alias: string): Promise<string>;
  joinSession(sessionId: string, alias: string): Promise<void>;
  leaveSession(): Promise<void>;
  
  // Player management
  setPlayerReady(isReady: boolean): Promise<void>;
  startSession(): Promise<void>;
  
  // Real-time subscriptions
  subscribeToSession(sessionId: string, callback: (session: Session | null) => void): () => void;
}

export interface Session {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  players: SessionPlayer[];
  maxPlayers: number;
  settings: SessionSettings;
  // Game-specific data will be added here
  gameState?: Record<string, unknown>;
}

export interface SessionPlayer {
  id: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  // Game-specific player data
  gameData?: Record<string, unknown>;
}

export interface SessionSettings {
  roundDuration: number; // in seconds
  maxRounds: number;
}

export interface CreateSessionParams {
  maxPlayers: number;
  settings: SessionSettings;
}

export interface SessionState {
  currentSession: Session | PartialSession | null;
  isLoading: boolean;
  error: string | null;
}

// Partial session state when only the ID is set (during loading)
export interface PartialSession {
  id: string;
}
