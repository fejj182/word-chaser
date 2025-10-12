import { updatePlayerScoreAdmin, addSubmittedWordAdmin, isWordAlreadySubmittedAdmin, getRoom, leaveRoomAdmin } from '../admin-room-utils';

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
  const mockRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock ref that can be chained
    const mockRef = {
      once: mockOnce,
      child: mockChild,
      remove: mockRemove,
      set: mockSet
    };
    
    mockAdminDb.ref.mockReturnValue(mockRef as any);
    
    mockChild.mockReturnValue({
      update: mockUpdate,
      set: mockSet,
      remove: mockRemove
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

  describe('leaveRoomAdmin', () => {
    it('removes player from room when other players remain', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        slug: 'test-room',
        status: 'playing',
        players: {
          'user1': {
            displayName: 'User 1',
            isHost: true,
            score: 50
          },
          'user2': {
            displayName: 'User 2',
            isHost: false,
            score: 30
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockRemove.mockResolvedValue(undefined);
      mockSet.mockResolvedValue(undefined);

      await leaveRoomAdmin('test-room-id', 'user1');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id/players/user2/isHost');
      expect(mockSet).toHaveBeenCalledWith(true);
      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id/players/user1');
      expect(mockRemove).toHaveBeenCalled();
    });

    it('transfers host when leaving player is host', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        slug: 'test-room',
        status: 'playing',
        players: {
          'user1': {
            displayName: 'User 1',
            isHost: true,
            score: 50
          },
          'user2': {
            displayName: 'User 2',
            isHost: false,
            score: 30
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockRemove.mockResolvedValue(undefined);
      mockSet.mockResolvedValue(undefined);

      await leaveRoomAdmin('test-room-id', 'user1');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id/players/user2/isHost');
      expect(mockSet).toHaveBeenCalledWith(true);
      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id/players/user1');
      expect(mockRemove).toHaveBeenCalled();
    });

    it('deletes room and slug when last player leaves', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        slug: 'test-room',
        status: 'playing',
        players: {
          'user1': {
            displayName: 'User 1',
            isHost: true,
            score: 50
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockRemove.mockResolvedValue(undefined);

      await leaveRoomAdmin('test-room-id', 'user1');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockRemove).toHaveBeenCalled(); // Room deletion
      expect(mockAdminDb.ref).toHaveBeenCalledWith('slugs/test-room');
      expect(mockRemove).toHaveBeenCalledTimes(2); // Room and slug deletion
    });

    it('deletes room without slug when room has no slug', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        status: 'playing',
        players: {
          'user1': {
            displayName: 'User 1',
            isHost: true,
            score: 50
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockRemove.mockResolvedValue(undefined);

      await leaveRoomAdmin('test-room-id', 'user1');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockRemove).toHaveBeenCalledTimes(1); // Only room deletion, no slug
    });

    it('returns early when room does not exist', async () => {
      mockOnce.mockResolvedValue({
        exists: () => false
      });

      await leaveRoomAdmin('non-existent-room', 'user1');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/non-existent-room');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('handles non-host player leaving without host transfer', async () => {
      const mockRoomData = {
        id: 'test-room-id',
        name: 'Test Room',
        slug: 'test-room',
        status: 'playing',
        players: {
          'user1': {
            displayName: 'User 1',
            isHost: true,
            score: 50
          },
          'user2': {
            displayName: 'User 2',
            isHost: false,
            score: 30
          }
        }
      };

      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => mockRoomData
      });
      mockRemove.mockResolvedValue(undefined);

      await leaveRoomAdmin('test-room-id', 'user2');

      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id');
      expect(mockOnce).toHaveBeenCalledWith('value');
      expect(mockAdminDb.ref).toHaveBeenCalledWith('rooms/test-room-id/players/user2');
      expect(mockRemove).toHaveBeenCalled();
      // Should not transfer host since user2 is not host
      expect(mockSet).not.toHaveBeenCalled();
    });
  });
});
