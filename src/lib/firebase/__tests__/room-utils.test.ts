import { createRoom, joinRoom, leaveRoom, subscribeToRoom, updatePlayerReady, startGame } from '../room-utils';
import { ref, push, set, get, onValue, off, update } from 'firebase/database';
import { db } from '../firebase';
import { CreateRoomParams } from '@/features/shared/types/room';

// Mock Firebase database functions
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  push: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  update: jest.fn(),
}));

// Mock the Firebase db instance
jest.mock('../firebase', () => ({
  db: {},
}));

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockPush = push as jest.MockedFunction<typeof push>;
const mockSet = set as jest.MockedFunction<typeof set>;
const mockGet = get as jest.MockedFunction<typeof get>;
const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;
const mockOff = off as jest.MockedFunction<typeof off>;
const mockUpdate = update as jest.MockedFunction<typeof update>;

describe('room-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('creates a room successfully', async () => {
      const mockRoomRef = { key: 'test-room-id' };
      const mockPushRef = {};
      
      mockRef.mockReturnValue(mockPushRef);
      mockPush.mockReturnValue(mockRoomRef);
      mockSet.mockResolvedValue(undefined);

      const params: CreateRoomParams = {
        name: 'Test Room',
        maxPlayers: 4,
        settings: {
          roundDuration: 60,
          maxRounds: 5,
          wordLength: 5,
          allowRepeats: false,
        },
      };

      const result = await createRoom(params, 'user-id', 'Test User');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms');
      expect(mockPush).toHaveBeenCalledWith(mockPushRef);
      expect(mockSet).toHaveBeenCalledWith(mockRoomRef, {
        id: 'test-room-id',
        name: 'Test Room',
        createdBy: 'user-id',
        createdAt: expect.any(Number),
        status: 'waiting',
        players: [{
          id: 'user-id',
          displayName: 'Test User',
          joinedAt: expect.any(Number),
          isHost: true,
          isReady: true,
        }],
        maxPlayers: 4,
        settings: params.settings,
      });
      expect(result).toBe('test-room-id');
    });
  });

  describe('joinRoom', () => {
    it('joins a room successfully', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [{ id: 'existing-user', displayName: 'Existing User' }],
          maxPlayers: 4,
          status: 'waiting',
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await joinRoom('test-room-id', 'new-user-id', 'New User');

      expect(mockRef).toHaveBeenCalledWith(db, 'rooms/test-room-id');
      expect(mockGet).toHaveBeenCalledWith(mockRoomRef);
      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/players/1': {
          id: 'new-user-id',
          displayName: 'New User',
          joinedAt: expect.any(Number),
          isHost: false,
          isReady: false,
        },
      });
    });

    it('throws error when room does not exist', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => false,
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('non-existent', 'user-id', 'User')).rejects.toThrow('Room not found');
    });

    it('throws error when room is full', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [
            { id: 'user1', displayName: 'User 1' },
            { id: 'user2', displayName: 'User 2' },
          ],
          maxPlayers: 2,
          status: 'waiting',
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('test-room-id', 'user3', 'User 3')).rejects.toThrow('Room is full');
    });

    it('throws error when game has already started', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [{ id: 'user1', displayName: 'User 1' }],
          maxPlayers: 4,
          status: 'playing',
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(joinRoom('test-room-id', 'user2', 'User 2')).rejects.toThrow('Game has already started');
    });
  });

  describe('leaveRoom', () => {
    it('removes player from room', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [
            { id: 'user1', displayName: 'User 1', isHost: true },
            { id: 'user2', displayName: 'User 2', isHost: false },
          ],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await leaveRoom('test-room-id', 'user1');

      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/players': [
          { id: 'user2', displayName: 'User 2', isHost: true },
        ],
      });
    });

    it('deletes room when last player leaves', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [{ id: 'user1', displayName: 'User 1' }],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockSet.mockResolvedValue(undefined);

      await leaveRoom('test-room-id', 'user1');

      expect(mockSet).toHaveBeenCalledWith(mockRoomRef, null);
    });
  });

  describe('subscribeToRoom', () => {
    it('subscribes to room updates', () => {
      const mockRoomRef = {};
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
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [
            { id: 'user1', displayName: 'User 1' },
            { id: 'user2', displayName: 'User 2' },
          ],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await updatePlayerReady('test-room-id', 'user1', true);

      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/players/0/isReady': true,
      });
    });

    it('throws error when player not found', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          players: [{ id: 'user1', displayName: 'User 1' }],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(updatePlayerReady('test-room-id', 'non-existent', true)).rejects.toThrow('Player not found in room');
    });
  });

  describe('startGame', () => {
    it('starts game when all players are ready', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          status: 'waiting',
          players: [
            { id: 'user1', displayName: 'User 1', isReady: true },
            { id: 'user2', displayName: 'User 2', isReady: true },
          ],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      await startGame('test-room-id');

      expect(mockUpdate).toHaveBeenCalledWith(ref(db), {
        'rooms/test-room-id/status': 'playing',
      });
    });

    it('throws error when not all players are ready', async () => {
      const mockRoomRef = {};
      const mockSnapshot = {
        exists: () => true,
        val: () => ({
          id: 'test-room-id',
          status: 'waiting',
          players: [
            { id: 'user1', displayName: 'User 1', isReady: true },
            { id: 'user2', displayName: 'User 2', isReady: false },
          ],
        }),
      };

      mockRef.mockReturnValue(mockRoomRef);
      mockGet.mockResolvedValue(mockSnapshot);

      await expect(startGame('test-room-id')).rejects.toThrow('Not all players are ready');
    });
  });
});
