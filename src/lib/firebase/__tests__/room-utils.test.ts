import { createRoom, joinRoom, leaveRoom, subscribeToRoom, updatePlayerReady, startGame, resolveRoomId } from '../room-utils';
import { ref, push, set, get, onValue, update, DatabaseReference, DataSnapshot } from 'firebase/database';
import { db } from '../firebase';
import { CreateRoomParams } from '@/features/room-management/types/room';

// Mock the grid generation utilities
jest.mock('@/lib/utils/grid-generation', () => ({
  generateLetterGrid: jest.fn(),
  getGridSizeConfig: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  push: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockPush = push as jest.MockedFunction<typeof push>;
const mockSet = set as jest.MockedFunction<typeof set>;
const mockGet = get as jest.MockedFunction<typeof get>;
const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;
const mockUpdate = update as jest.MockedFunction<typeof update>;

// Import mocked grid generation functions
const { generateLetterGrid, getGridSizeConfig } = jest.requireMock('@/lib/utils/grid-generation');
const mockGenerateLetterGrid = generateLetterGrid as jest.MockedFunction<typeof generateLetterGrid>;
const mockGetGridSizeConfig = getGridSizeConfig as jest.MockedFunction<typeof getGridSizeConfig>;

// Create properly typed mock objects
const createMockRef = (key: string | null = null): DatabaseReference => ({
  key,
  parent: null,
  root: null as unknown as DatabaseReference,
  ref: jest.fn() as unknown as DatabaseReference,
  isEqual: jest.fn(),
  toString: jest.fn(),
  toJSON: jest.fn()
});

const createMockSnapshot = (exists: boolean, data: unknown = null): DataSnapshot => ({
  ref: createMockRef(),
  priority: null,
  key: 'test-key',
  size: 0,
  exists: () => exists,
  val: () => data,
  child: jest.fn(),
  forEach: jest.fn(),
  hasChild: jest.fn(),
  hasChildren: jest.fn(),
  numChildren: jest.fn(),
  toJSON: jest.fn(),
  exportVal: jest.fn()
} as unknown as DataSnapshot);

describe('room-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('creates a room successfully', async () => {
      const mockRoomRef = createMockRef('test-room-id');
      const mockPushRef = createMockRef();
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef as ReturnType<typeof push>);
      mockSet.mockResolvedValue(undefined);
      // First get() call for slug availability check
      mockGet.mockResolvedValueOnce(createMockSnapshot(false));

      const params: CreateRoomParams = {
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      };

      const result = await createRoom(params, 'user-id', 'Test User');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms');
      expect(mockPush).toHaveBeenCalledWith(mockPushRef);
      expect(mockSet).toHaveBeenCalledWith(mockRoomRef, {
        id: 'test-room-id',
        name: expect.any(String),
        slug: expect.any(String),
        createdBy: 'user-id',
        createdAt: expect.any(Number),
        status: 'waiting',
        players: {
          'user-id': {
            displayName: 'Test User',
            joinedAt: expect.any(Number),
            isHost: true,
            isReady: true,
            score: 0,
            wordsFound: 0,
          },
        },
        maxPlayers: 4,
        settings: params.settings,
      });
      expect(result).toBe('test-room-id');
    });
  });

  describe('joinRoom', () => {
    it('joins a room successfully', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: { 'existing-user': { displayName: 'Existing User' } },
        maxPlayers: 4,
        status: 'waiting',
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await joinRoom('test-room-id', 'new-user-id', 'New User');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-room-id');
      expect(mockGet).toHaveBeenCalledWith(mockRoomRef);
      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/players/new-user-id': {
          displayName: 'New User',
          joinedAt: expect.any(Number),
          isHost: false,
          isReady: false,
          score: 0,
          wordsFound: 0,
        },
      });
    });

    it('throws error when room does not exist', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(false);

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('non-existent', 'user-id', 'User')).rejects.toThrow('Room not found');
    });

    it('throws error when room is full', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: {
          'user1': { displayName: 'User 1' },
          'user2': { displayName: 'User 2' },
        },
        maxPlayers: 2,
        status: 'waiting',
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('test-room-id', 'user3', 'User 3')).rejects.toThrow('Room is full');
    });

    it('throws error when game has already started', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: { 'user1': { displayName: 'User 1' } },
        maxPlayers: 4,
        status: 'playing',
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('test-room-id', 'user2', 'User 2')).rejects.toThrow('Game has already started');
    });
  });

  describe('leaveRoom', () => {
    it('removes player from room', async () => {
      const mockPlayerRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: {
          'user1': { displayName: 'User 1', isHost: true },
          'user2': { displayName: 'User 2', isHost: false },
        },
      });

      mockRef.mockReturnValue(mockPlayerRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockSet.mockResolvedValue(undefined);

      await leaveRoom('test-room-id', 'user1');

      expect(mockSet).toHaveBeenCalledWith(mockPlayerRef, null);
    });

    it('deletes room when last player leaves', async () => {
      const mockRoomRef = createMockRef();
      const mockSlugRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        slug: 'test-slug',
        players: { 'user1': { displayName: 'User 1' } },
      });

      mockRef.mockImplementation((database, path) => {
        if (path === 'rooms/test-room-id') {
          return mockRoomRef;
        }
        if (path === 'slugs/test-slug') {
          return mockSlugRef;
        }
        return mockRoomRef;
      });
      mockGet.mockResolvedValue(mockSnapshot);
      mockSet.mockResolvedValue(undefined);

      await leaveRoom('test-room-id', 'user1');

      expect(mockSet).toHaveBeenCalledWith(mockRoomRef, null);
      expect(mockSet).toHaveBeenCalledWith(mockSlugRef, null);
    });

    it('does not delete slug when players remain in room', async () => {
      const mockPlayerRef = createMockRef();
      const mockSlugRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        slug: 'test-slug',
        players: {
          'user1': { displayName: 'User 1', isHost: true },
          'user2': { displayName: 'User 2', isHost: false },
        },
      });

      mockRef.mockImplementation((_, path) => {
        if (path === 'rooms/test-room-id/players/user1') {
          return mockPlayerRef;
        }
        return mockSlugRef;
      });
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await leaveRoom('test-room-id', 'user1');

      expect(mockSet).toHaveBeenCalledWith(mockPlayerRef, null);
      expect(mockSet).not.toHaveBeenCalledWith(mockSlugRef, null);
    });
  });

  describe('resolveRoomId', () => {
    it('resolves room ID when room exists by ID', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        name: 'Test Room'
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      const result = await resolveRoomId('test-room-id');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-room-id');
      expect(mockGet).toHaveBeenCalledWith(mockRoomRef);
      expect(result).toBe('test-room-id');
    });

    it('resolves room ID when room exists by slug', async () => {
      const mockRoomRef = createMockRef();
      const mockSlugRef = createMockRef();
      const mockRoomSnapshot = createMockSnapshot(false);
      const mockSlugSnapshot = createMockSnapshot(true, 'actual-room-id');

      mockRef.mockImplementation((database, path) => {
        if (path === 'rooms/test-slug') {
          return mockRoomRef;
        }
        if (path === 'slugs/test-slug') {
          return mockSlugRef;
        }
        return mockRoomRef;
      });
      mockGet
        .mockResolvedValueOnce(mockRoomSnapshot) // First call for room by ID
        .mockResolvedValueOnce(mockSlugSnapshot); // Second call for slug

      const result = await resolveRoomId('test-slug');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-slug');
      expect(mockRef).toHaveBeenCalledWith(db, 'slugs/test-slug');
      expect(result).toBe('actual-room-id');
    });

    it('throws error when room not found by ID or slug', async () => {
      const mockRoomRef = createMockRef();
      const mockSlugRef = createMockRef();
      const mockRoomSnapshot = createMockSnapshot(false);
      const mockSlugSnapshot = createMockSnapshot(false);

      mockRef.mockImplementation((database, path) => {
        if (path === 'rooms/nonexistent') {
          return mockRoomRef;
        }
        if (path === 'slugs/nonexistent') {
          return mockSlugRef;
        }
        return mockRoomRef;
      });
      mockGet
        .mockResolvedValueOnce(mockRoomSnapshot) // First call for room by ID
        .mockResolvedValueOnce(mockSlugSnapshot); // Second call for slug

      await expect(resolveRoomId('nonexistent')).rejects.toThrow('Room not found');
    });

    it('throws error when room key is empty or whitespace', async () => {
      await expect(resolveRoomId('')).rejects.toThrow('Room not found');
      await expect(resolveRoomId('   ')).rejects.toThrow('Room not found');
    });

    it('trims whitespace from room key', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        name: 'Test Room'
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      const result = await resolveRoomId('  test-room-id  ');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-room-id');
      expect(result).toBe('test-room-id');
    });
  });

  describe('subscribeToRoom', () => {
    it('subscribes to room updates', () => {
      const mockRoomRef = createMockRef();
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();

      mockRef.mockReturnValue(mockRoomRef);
      mockOnValue.mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToRoom('test-room-id', mockCallback);

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-room-id');
      expect(mockOnValue).toHaveBeenCalledWith(mockRoomRef, expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('updatePlayerReady', () => {
    it('updates player ready status', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: {
          'user1': { displayName: 'User 1' },
          'user2': { displayName: 'User 2' },
        },
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await updatePlayerReady('test-room-id', 'user1', true);

      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/players/user1/isReady': true,
      });
    });

    it('throws error when player not found', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        players: { 'user1': { displayName: 'User 1' } },
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(updatePlayerReady('test-room-id', 'non-existent', true)).rejects.toThrow('Player not found in room');
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      // Setup default mocks for grid generation
      mockGetGridSizeConfig.mockReturnValue({ size: 4 });
      mockGenerateLetterGrid.mockReturnValue([
        ['A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
        ['I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P']
      ]);
    });

    it('starts game when all players are ready', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'waiting',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
          'user2': { displayName: 'User 2', isReady: true },
        },
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await startGame('test-room-id');

      expect(mockGetGridSizeConfig).toHaveBeenCalledWith('small');
      expect(mockGenerateLetterGrid).toHaveBeenCalledWith({ size: 4 });
      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/status': 'playing',
        'rooms/test-room-id/gameData': expect.objectContaining({
          grid: [
            ['A', 'B', 'C', 'D'],
            ['E', 'F', 'G', 'H'],
            ['I', 'J', 'K', 'L'],
            ['M', 'N', 'O', 'P']
          ],
          currentRound: 1,
          submittedWords: {},
          roundStartTime: expect.any(Number),
          roundEndTime: expect.any(Number),
          timerStatus: 'running'
        }),
      });
    });

    it('throws error when room does not exist', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(false);

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(startGame('non-existent-room')).rejects.toThrow('Room not found');
    });

    it('throws error when game has already started', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'playing',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
          'user2': { displayName: 'User 2', isReady: true },
        },
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(startGame('test-room-id')).rejects.toThrow('Game has already started');
    });

    it('throws error when not all players are ready', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'waiting',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
          'user2': { displayName: 'User 2', isReady: false },
        },
      });

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(startGame('test-room-id')).rejects.toThrow('Not all players are ready');
    });

    it('generates grid with correct size configuration for small grid', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'waiting',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
        },
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      });

      mockGetGridSizeConfig.mockReturnValue({ size: 4 });
      mockGenerateLetterGrid.mockReturnValue([
        ['A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
        ['I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P']
      ]);

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await startGame('test-room-id');

      expect(mockGetGridSizeConfig).toHaveBeenCalledWith('small');
      expect(mockGenerateLetterGrid).toHaveBeenCalledWith({ size: 4 });
    });

    it('generates grid with correct size configuration for medium grid', async () => {
      const mockRoomRef = createMockRef();
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'waiting',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
        },
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'medium',
        },
      });

      mockGetGridSizeConfig.mockReturnValue({ size: 6 });
      mockGenerateLetterGrid.mockReturnValue([
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['G', 'H', 'I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P', 'Q', 'R'],
        ['S', 'T', 'U', 'V', 'W', 'X'],
        ['Y', 'Z', 'A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H', 'I', 'J']
      ]);

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await startGame('test-room-id');

      expect(mockGetGridSizeConfig).toHaveBeenCalledWith('medium');
      expect(mockGenerateLetterGrid).toHaveBeenCalledWith({ size: 6 });
    });


    it('stores gameData with correct structure', async () => {
      const mockRoomRef = createMockRef();
      const mockGrid = [
        ['A', 'B', 'C', 'D'],
        ['E', 'F', 'G', 'H'],
        ['I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P']
      ];
      const mockSnapshot = createMockSnapshot(true, {
        id: 'test-room-id',
        status: 'waiting',
        players: {
          'user1': { displayName: 'User 1', isReady: true },
        },
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      });

      mockGenerateLetterGrid.mockReturnValue(mockGrid);
      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await startGame('test-room-id');

      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/status': 'playing',
        'rooms/test-room-id/gameData': expect.objectContaining({
          grid: mockGrid,
          currentRound: 1,
          submittedWords: {},
          roundStartTime: expect.any(Number),
          roundEndTime: expect.any(Number),
          timerStatus: 'running'
        }),
      });
    });

  });

  describe('slug generation', () => {
    it('generates Glaswegian-style slugs with correct format', async () => {
      const mockRoomRef = createMockRef('test-room-id');
      const mockPushRef = createMockRef();
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef as ReturnType<typeof push>);
      mockSet.mockResolvedValue(undefined);
      mockGet.mockResolvedValueOnce(createMockSnapshot(false));

      const params: CreateRoomParams = {
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      };

      await createRoom(params, 'user-id', 'Test User');

      // Check that set was called with a room object
      const setCall = mockSet.mock.calls.find(call => 
        typeof call[1] === 'object' && call[1] && (call[1] as Record<string, unknown>)?.name
      );
      expect(setCall).toBeDefined();
      
      const roomData = setCall![1] as Record<string, unknown>;
      const { name, slug } = roomData;
      
      expect(name).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
      expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
      expect(name).toBe(slug);
      
      const [word1, word2] = (name as string).split('-');
      expect(word1).toBeDefined();
      expect(word2).toBeDefined();
      const number = (name as string).split('-')[2];
      expect(parseInt(number)).toBeGreaterThanOrEqual(100);
      expect(parseInt(number)).toBeLessThanOrEqual(999);
    });

    it('handles slug conflicts by generating new slugs', async () => {
      const mockRoomRef = createMockRef('test-room-id');
      const mockPushRef = createMockRef();
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef as ReturnType<typeof push>);
      mockSet.mockResolvedValue(undefined);
      
      // First two attempts return existing slugs, third attempt succeeds
      mockGet
        .mockResolvedValueOnce(createMockSnapshot(true)) // First slug exists
        .mockResolvedValueOnce(createMockSnapshot(true)) // Second slug exists
        .mockResolvedValueOnce(createMockSnapshot(false)); // Third slug is unique

      const params: CreateRoomParams = {
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small'
        },
      };

      await createRoom(params, 'user-id', 'Test User');

      // Should have checked for slug availability multiple times
      expect(mockGet).toHaveBeenCalledTimes(3);
      
      // Verify the final slug was stored
      const setCall = mockSet.mock.calls.find(call => 
        typeof call[1] === 'object' && call[1] && (call[1] as Record<string, unknown>)?.name
      );
      expect(setCall).toBeDefined();
      
      const roomData = setCall![1] as Record<string, unknown>;
      expect(roomData.name).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
    });

    it('uses fallback with timestamp when all attempts fail', async () => {
      const mockRoomRef = createMockRef('test-room-id');
      const mockPushRef = createMockRef();
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef as ReturnType<typeof push>);
      mockSet.mockResolvedValue(undefined);
      
      // All attempts return existing slugs
      mockGet.mockResolvedValue(createMockSnapshot(true));

      const params: CreateRoomParams = {
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      };

      await createRoom(params, 'user-id', 'Test User');

      // Should have checked for slug availability 20 times (max attempts)
      expect(mockGet).toHaveBeenCalledTimes(20);
      
      // Verify the fallback slug was stored
      const setCall = mockSet.mock.calls.find(call => 
        typeof call[1] === 'object' && call[1] && (call[1] as Record<string, unknown>)?.name
      );
      expect(setCall).toBeDefined();
      
      const roomData = setCall![1] as Record<string, unknown>;
      // Fallback should include timestamp
      expect(roomData.name).toMatch(/^[a-z]+-[a-z]+-\d{3}-\d+$/);
    });

    it('stores slug mapping in slugs path', async () => {
      const mockRoomRef = createMockRef('test-room-id');
      const mockPushRef = createMockRef();
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef as ReturnType<typeof push>);
      mockSet.mockResolvedValue(undefined);
      mockGet.mockResolvedValueOnce(createMockSnapshot(false));

      const params: CreateRoomParams = {
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          gridSize: 'small',
        },
      };

      await createRoom(params, 'user-id', 'Test User');

      // Should have called set twice: once for room, once for slug mapping
      expect(mockSet).toHaveBeenCalledTimes(2);
      
      // Find the slug mapping call
      const slugMappingCall = mockSet.mock.calls.find(call => 
        typeof call[1] === 'string'
      );
      expect(slugMappingCall).toBeDefined();
      expect(slugMappingCall![1]).toBe('test-room-id');
    });
  });
});
