import { renderHook, act, waitFor } from '@testing-library/react';
import { useDictionaryWorker } from '../useDictionaryWorker';

// Mock the Worker constructor
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((error: ErrorEvent) => void) | null,
};

// Mock Worker global
global.Worker = jest.fn().mockImplementation(() => mockWorker);

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockWorker.onmessage = null;
  mockWorker.onerror = null;
});

describe('useDictionaryWorker (Simplified)', () => {
  it('should initialize worker and set ready state', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    // Wait for worker to be ready
    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    // Verify worker was created
    expect(global.Worker).toHaveBeenCalledWith(
      expect.any(URL),
      { type: 'module' }
    );
  });

  it('should handle worker not supported', () => {
    // Mock Worker as undefined
    const originalWorker = global.Worker;
    // @ts-ignore
    global.Worker = undefined;

    const { result } = renderHook(() => useDictionaryWorker());

    expect(result.current.isWorkerReady).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      'Web Workers not supported, falling back to main thread'
    );

    // Restore Worker
    global.Worker = originalWorker;
  });

  it('should validate word successfully via worker', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    // Mock successful response
    const validateWordPromise = result.current.validateWord('cat');

    // Simulate worker response
    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'VALIDATE_WORD',
            success: true,
            data: true
          }
        } as MessageEvent);
      }
    });

    const isValid = await validateWordPromise;
    expect(isValid).toBe(true);
    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      id: 'op_1',
      type: 'VALIDATE_WORD',
      payload: { word: 'cat' }
    });
  });

  it('should fallback to main thread when worker fails', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    // Mock worker error
    act(() => {
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error'));
      }
    });

    // Wait for worker to be marked as not ready
    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(false);
    });

    // Now validateWord should fallback to main thread
    const isValid = await result.current.validateWord('cat');
    expect(isValid).toBe(true); // Should work via main thread fallback
  });

  it('should find paths successfully', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    const mockGrid = [['A', 'B'], ['C', 'D']];
    const mockPaths = [[{ row: 0, col: 0 }, { row: 0, col: 1 }]];

    const findPathsPromise = result.current.findPaths(mockGrid, 'AB');

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'FIND_PATHS',
            success: true,
            data: mockPaths
          }
        } as MessageEvent);
      }
    });

    const paths = await findPathsPromise;
    expect(paths).toEqual(mockPaths);
    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      id: 'op_1',
      type: 'FIND_PATHS',
      payload: { grid: mockGrid, word: 'AB', options: undefined }
    });
  });

  it('should find best path successfully', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    const mockGrid = [['A', 'B'], ['C', 'D']];
    const mockBestPath = [{ row: 0, col: 0 }, { row: 0, col: 1 }];

    const findBestPathPromise = result.current.findBestPath(mockGrid, 'AB');

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'FIND_BEST_PATH',
            success: true,
            data: mockBestPath
          }
        } as MessageEvent);
      }
    });

    const bestPath = await findBestPathPromise;
    expect(bestPath).toEqual(mockBestPath);
  });

  it('should check if word can be formed', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    const mockGrid = [['A', 'B'], ['C', 'D']];

    const canFormWordPromise = result.current.canFormWord(mockGrid, 'AB');

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'CAN_FORM_WORD',
            success: true,
            data: true
          }
        } as MessageEvent);
      }
    });

    const canForm = await canFormWordPromise;
    expect(canForm).toBe(true);
  });

  it('should handle batch operations', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    const operations = [
      { type: 'VALIDATE_WORD', payload: { word: 'cat' } },
      { type: 'VALIDATE_WORD', payload: { word: 'dog' } }
    ];

    const batchPromise = result.current.batchOperations(operations);

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'BATCH_OPERATIONS',
            success: true,
            data: [true, true]
          }
        } as MessageEvent);
      }
    });

    const results = await batchPromise;
    expect(results).toEqual([true, true]);
    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      id: 'op_1',
      type: 'BATCH_OPERATIONS',
      payload: { operations }
    });
  });

  it('should cleanup worker on unmount', () => {
    const { unmount } = renderHook(() => useDictionaryWorker());

    unmount();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should handle worker initialization failure', () => {
    // Mock Worker constructor to throw
    const originalWorker = global.Worker;
    global.Worker = jest.fn().mockImplementation(() => {
      throw new Error('Worker creation failed');
    });

    const { result } = renderHook(() => useDictionaryWorker());

    expect(result.current.isWorkerReady).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to initialize worker:',
      expect.any(Error)
    );

    // Restore Worker
    global.Worker = originalWorker;
  });

  it('should handle pathfinding with options', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    const mockGrid = [['A', 'B'], ['C', 'D']];
    const options = { allowDiagonals: false, minLength: 2 };

    const findPathsPromise = result.current.findPaths(mockGrid, 'AB', options);

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            id: 'op_1',
            type: 'FIND_PATHS',
            success: true,
            data: []
          }
        } as MessageEvent);
      }
    });

    await findPathsPromise;
    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      id: 'op_1',
      type: 'FIND_PATHS',
      payload: { grid: mockGrid, word: 'AB', options }
    });
  });

  it('should handle fallback for all operation types', async () => {
    const { result } = renderHook(() => useDictionaryWorker());

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(true);
    });

    // Simulate worker failure
    act(() => {
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error'));
      }
    });

    await waitFor(() => {
      expect(result.current.isWorkerReady).toBe(false);
    });

    const mockGrid = [['A', 'B'], ['C', 'D']];

    // Test all fallback operations
    const validateResult = await result.current.validateWord('cat');
    const pathsResult = await result.current.findPaths(mockGrid, 'AB');
    const bestPathResult = await result.current.findBestPath(mockGrid, 'AB');
    const canFormResult = await result.current.canFormWord(mockGrid, 'AB');

    expect(validateResult).toBe(true); // Should work via main thread
    expect(Array.isArray(pathsResult)).toBe(true);
    expect(bestPathResult).toBeDefined();
    expect(typeof canFormResult).toBe('boolean');
  });
});
