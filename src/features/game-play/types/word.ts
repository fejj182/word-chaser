export interface WordSubmission {
  word: string;
  roomId: string;
  playerId: string;
  playerName: string;
  submittedAt: number;
}

export interface WordValidationResult {
  isValid: boolean;
  score: number;
  reason?: string;
  path?: Array<{ row: number; col: number }>;
}

export interface WordValidationRequest {
  word: string;
  roomId: string;
  playerId: string;
  playerName: string;
  boardLetters: string[][];
}

export interface WordValidationResponse {
  success: boolean;
  result: WordValidationResult;
  error?: string;
}
