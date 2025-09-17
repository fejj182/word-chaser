import { updatePlayerScoreAdmin, addSubmittedWordAdmin, isWordAlreadySubmittedAdmin, getRoom } from '../admin-room-utils';

// Mock Firebase Admin SDK
jest.mock('../admin', () => ({
  adminDb: {
    ref: jest.fn()
  }
}));

import { adminDb } from '../admin';

const mockAdminDb = adminDb as jest.Mocked<typeof adminDb>;

describe('admin-room-utils', () => {
  const mockOnce = jest.fn();
  const mockChild = jest.fn();
  const mockUpdate = jest.fn();
  const mockSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAdminDb.ref.mockReturnValue({
      once: mockOnce,
      child: mockChild
    } as any);
    
    mockChild.mockReturnValue({
      update: mockUpdate,
      set: mockSet
    } as any);
  });

  describe('updatePlayerScoreAdmin', () => {
    it('updates player score successfully', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        status: 'playing',
        players: {
          'user-id': {
            displayName: 'Test User',
            score: 50,
            wordsFound: 2,
          },
        },
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockUpdate.mockResolvedValue(undefined);

      await updatePlayerScoreAdmin('test-room-id', 'user-id', 30);

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockChild).toHaveBeenCalledWith('players/user-id');
      expect(mockUpdate).toHaveBeenCalledWith({
        score: 80,
        wordsFound: 3
      });
    });

    it('throws error when room does not exist', async () => {
      mockOnce.mockResolvedValue({
        exists: () => false
      });

      await expect(updatePlayerScoreAdmin('non-existent-room', 'user-id', 30))
        .rejects.toThrow('Room not found');
    });

    it('throws error when player not found', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        status: 'playing',
        players: {
          'other-user-id': {
            displayName: 'Other User',
            score: 50,
            wordsFound: 2,
          },
        },
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      await expect(updatePlayerScoreAdmin('test-room-id', 'user-id', 30))
        .rejects.toThrow('Player not found in room');
    });
  });

  describe('getRoom', () => {
    it('returns room data when room exists', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        status: 'playing'
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      const result = await getRoom('test-room-id');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(result).toEqual(mockRoomData);
    });

    it('returns null when room does not exist', async () => {
      mockOnce.mockResolvedValue({
        exists: () => false
      });

      const result = await getRoom('non-existent-room');

      expect(result).toBeNull();
    });
  });

  describe('addSubmittedWordAdmin', () => {
    it('adds submitted word successfully', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        status: 'playing',
        players: {
          'user-id': {
            displayName: 'Test User',
            score: 50,
            wordsFound: 2,
          },
        },
        gameData: {
          submittedWords: {}
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockSet.mockResolvedValue(undefined);

      await addSubmittedWordAdmin('test-room-id', 'test', 'user-id', 'Test User', 10);

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockChild).toHaveBeenCalledWith('gameData/submittedWords/TEST');
      expect(mockSet).toHaveBeenCalledWith({
        word: 'TEST',
        playerId: 'user-id',
        playerName: 'Test User',
        score: 10,
        submittedAt: expect.any(Number)
      });
    });

    it('throws error when word already exists', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        status: 'playing',
        players: {
          'user-id': {
            displayName: 'Test User',
            score: 50,
            wordsFound: 2,
          },
        },
        gameData: {
          submittedWords: {
            'TEST': {
              word: 'TEST',
              playerId: 'other-user',
              playerName: 'Other User',
              score: 10,
              submittedAt: Date.now()
            }
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      await expect(addSubmittedWordAdmin('test-room-id', 'test', 'user-id', 'Test User', 10))
        .rejects.toThrow('Word has already been submitted');
    });
  });

  describe('isWordAlreadySubmittedAdmin', () => {
    it('returns true when word is already submitted', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        gameData: {
          submittedWords: {
            'TEST': {
              word: 'TEST',
              playerId: 'user-id',
              playerName: 'Test User',
              score: 10,
              submittedAt: Date.now()
            }
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      const result = await isWordAlreadySubmittedAdmin('test-room-id', 'test');

      expect(result).toBe(true);
    });

    it('returns false when word is not submitted', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        gameData: {
          submittedWords: {}
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      const result = await isWordAlreadySubmittedAdmin('test-room-id', 'new');

      expect(result).toBe(false);
    });

    it('returns false when no gameData exists', async () => {
      const mockRoomData = {
        id: 'test-room-id'
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });

      const result = await isWordAlreadySubmittedAdmin('test-room-id', 'test');

      expect(result).toBe(false);
    });
  });
});
