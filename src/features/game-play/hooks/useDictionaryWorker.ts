'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GridPosition } from '../contexts/GamePlayContext';
import { PathfindingOptions } from '@/lib/utils/pathfinding';

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

interface PendingOperation {
  id: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export interface UseDictionaryWorkerReturn {
  isWorkerReady: boolean;
  validateWord: (word: string) => Promise<boolean>;
  findPaths: (grid: string[][], word: string, options?: PathfindingOptions) => Promise<GridPosition[][]>;
  findBestPath: (grid: string[][], word: string, options?: PathfindingOptions) => Promise<GridPosition[] | null>;
  canFormWord: (grid: string[][], word: string, options?: PathfindingOptions) => Promise<boolean>;
  batchOperations: (operations: Array<{ type: string; payload: any }>) => Promise<any[]>;
}

/**
 * Hook for managing dictionary Web Worker operations
 */
export function useDictionaryWorker(): UseDictionaryWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingOperationsRef = useRef<Map<string, PendingOperation>>(new Map());
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const operationIdRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported, falling back to main thread');
      return;
    }

    try {
      const worker = new Worker(
        new URL('@/lib/workers/dictionary.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error } = event.data;
        const pendingOp = pendingOperationsRef.current.get(id);

        if (pendingOp) {
          pendingOperationsRef.current.delete(id);

          if (success) {
            pendingOp.resolve(data);
          } else {
            pendingOp.reject(new Error(error || 'Worker operation failed'));
          }
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending operations
        for (const [id, operation] of pendingOperationsRef.current) {
          operation.reject(new Error('Worker error'));
        }
        pendingOperationsRef.current.clear();
        setIsWorkerReady(false);
      };

      workerRef.current = worker;
      setIsWorkerReady(true);

      // Cleanup function
      return () => {
        // Reject all pending operations
        for (const [id, operation] of pendingOperationsRef.current) {
          operation.reject(new Error('Worker terminated'));
        }
        pendingOperationsRef.current.clear();
        
        worker.terminate();
        workerRef.current = null;
        setIsWorkerReady(false);
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      setIsWorkerReady(false);
    }
  }, []);

  // Clean up old pending operations (timeout after 30 seconds)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [id, operation] of pendingOperationsRef.current) {
        if (now - operation.timestamp > timeout) {
          operation.reject(new Error('Operation timeout'));
          pendingOperationsRef.current.delete(id);
        }
      }
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  // Send message to worker
  const sendMessage = useCallback(<T>(type: WorkerMessage['type'], payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      const id = `op_${++operationIdRef.current}`;
      const message: WorkerMessage = { id, type, payload };

      pendingOperationsRef.current.set(id, {
        id,
        resolve,
        reject,
        timestamp: Date.now()
      });

      workerRef.current.postMessage(message);
    });
  }, [isWorkerReady]);

  // Worker operations
  const validateWord = useCallback(async (word: string): Promise<boolean> => {
    try {
      return await sendMessage<boolean>('VALIDATE_WORD', { word });
    } catch (error) {
      console.warn('Worker validation failed, falling back to main thread:', error);
      // Fallback to main thread validation
      const { isValidWord } = await import('@/lib/dictionary');
      return isValidWord(word);
    }
  }, [sendMessage]);

  const findPaths = useCallback(async (
    grid: string[][], 
    word: string, 
    options?: PathfindingOptions
  ): Promise<GridPosition[][]> => {
    try {
      return await sendMessage<GridPosition[][]>('FIND_PATHS', { grid, word, options });
    } catch (error) {
      console.warn('Worker pathfinding failed, falling back to main thread:', error);
      // Fallback to main thread pathfinding
      const { findWordPaths } = await import('@/lib/utils/pathfinding');
      return findWordPaths(grid, word, options);
    }
  }, [sendMessage]);

  const findBestPath = useCallback(async (
    grid: string[][], 
    word: string, 
    options?: PathfindingOptions
  ): Promise<GridPosition[] | null> => {
    try {
      return await sendMessage<GridPosition[] | null>('FIND_BEST_PATH', { grid, word, options });
    } catch (error) {
      console.warn('Worker pathfinding failed, falling back to main thread:', error);
      // Fallback to main thread pathfinding
      const { findBestWordPath } = await import('@/lib/utils/pathfinding');
      return findBestWordPath(grid, word, options);
    }
  }, [sendMessage]);

  const canFormWord = useCallback(async (
    grid: string[][], 
    word: string, 
    options?: PathfindingOptions
  ): Promise<boolean> => {
    try {
      return await sendMessage<boolean>('CAN_FORM_WORD', { grid, word, options });
    } catch (error) {
      console.warn('Worker pathfinding failed, falling back to main thread:', error);
      // Fallback to main thread pathfinding
      const { canFormWord: canFormWordMain } = await import('@/lib/utils/pathfinding');
      return canFormWordMain(grid, word, options);
    }
  }, [sendMessage]);

  const batchOperations = useCallback(async (
    operations: Array<{ type: string; payload: any }>
  ): Promise<any[]> => {
    try {
      return await sendMessage<any[]>('BATCH_OPERATIONS', { operations });
    } catch (error) {
      console.warn('Worker batch operations failed, falling back to main thread:', error);
      // Fallback to sequential main thread operations
      const results = [];
      for (const operation of operations) {
        switch (operation.type) {
          case 'VALIDATE_WORD':
            const { isValidWord } = await import('@/lib/dictionary');
            results.push(isValidWord(operation.payload.word));
            break;
          case 'FIND_PATHS':
            const { findWordPaths } = await import('@/lib/utils/pathfinding');
            results.push(findWordPaths(operation.payload.grid, operation.payload.word, operation.payload.options));
            break;
          case 'FIND_BEST_PATH':
            const { findBestWordPath } = await import('@/lib/utils/pathfinding');
            results.push(findBestWordPath(operation.payload.grid, operation.payload.word, operation.payload.options));
            break;
          case 'CAN_FORM_WORD':
            const { canFormWord: canFormWordMain } = await import('@/lib/utils/pathfinding');
            results.push(canFormWordMain(operation.payload.grid, operation.payload.word, operation.payload.options));
            break;
          default:
            results.push(null);
        }
      }
      return results;
    }
  }, [sendMessage]);

  return {
    isWorkerReady,
    validateWord,
    findPaths,
    findBestPath,
    canFormWord,
    batchOperations
  };
}

