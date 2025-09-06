/**
 * Web Worker for dictionary operations and pathfinding
 * Handles heavy computational tasks to keep the main thread responsive
 */

import { 
  findWordPaths, 
  findBestWordPath, 
  canFormWord,
  GridPosition,
  PathfindingOptions 
} from '../utils/pathfinding';

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'VALIDATE_WORD' | 'FIND_PATHS' | 'FIND_BEST_PATH' | 'CAN_FORM_WORD' | 'BATCH_OPERATIONS';
  payload: any;
}

interface WorkerResponse {
  id: string;
  type: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Dictionary operations
interface ValidateWordPayload {
  word: string;
}

interface FindPathsPayload {
  grid: string[][];
  word: string;
  options?: PathfindingOptions;
}

interface CanFormWordPayload {
  grid: string[][];
  word: string;
  options?: PathfindingOptions;
}

interface BatchOperationsPayload {
  operations: Array<{
    type: 'VALIDATE_WORD' | 'FIND_PATHS' | 'FIND_BEST_PATH' | 'CAN_FORM_WORD';
    payload: any;
  }>;
}

// Simple dictionary for worker (will be loaded from main thread)
let dictionary: Set<string> = new Set();

// Load dictionary from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'VALIDATE_WORD':
        result = await validateWord(payload as ValidateWordPayload);
        break;

      case 'FIND_PATHS':
        result = await findPaths(payload as FindPathsPayload);
        break;

      case 'FIND_BEST_PATH':
        result = await findBestPath(payload as FindPathsPayload);
        break;

      case 'CAN_FORM_WORD':
        result = await canFormWordOperation(payload as CanFormWordPayload);
        break;

      case 'BATCH_OPERATIONS':
        result = await batchOperations(payload as BatchOperationsPayload);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      id,
      type,
      success: true,
      data: result
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    self.postMessage(response);
  }
});

// Dictionary validation
async function validateWord(payload: ValidateWordPayload): Promise<boolean> {
  const { word } = payload;
  const cleanWord = word.toLowerCase().trim();
  return cleanWord.length >= 3 && dictionary.has(cleanWord);
}

// Pathfinding operations
async function findPaths(payload: FindPathsPayload): Promise<GridPosition[][]> {
  const { grid, word, options } = payload;
  return findWordPaths(grid, word, options);
}

async function findBestPath(payload: FindPathsPayload): Promise<GridPosition[] | null> {
  const { grid, word, options } = payload;
  return findBestWordPath(grid, word, options);
}

async function canFormWordOperation(payload: CanFormWordPayload): Promise<boolean> {
  const { grid, word, options } = payload;
  return canFormWord(grid, word, options);
}

// Batch operations for efficiency
async function batchOperations(payload: BatchOperationsPayload): Promise<any[]> {
  const { operations } = payload;
  const results = [];

  for (const operation of operations) {
    let result: any;

    switch (operation.type) {
      case 'VALIDATE_WORD':
        result = await validateWord(operation.payload);
        break;
      case 'FIND_PATHS':
        result = await findPaths(operation.payload);
        break;
      case 'FIND_BEST_PATH':
        result = await findBestPath(operation.payload);
        break;
      case 'CAN_FORM_WORD':
        result = await canFormWordOperation(operation.payload);
        break;
      default:
        throw new Error(`Unknown batch operation type: ${operation.type}`);
    }

    results.push(result);
  }

  return results;
}

// Initialize worker
console.log('Dictionary worker initialized');

// Export types for main thread
export type { WorkerMessage, WorkerResponse };


