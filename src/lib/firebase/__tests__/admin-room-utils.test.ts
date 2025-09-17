import { updatePlayerScoreAdmin } from '../admin-room-utils';

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

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAdminDb.ref.mockReturnValue({
      once: mockOnce,
      child: mockChild
    } as any);
    
    mockChild.mockReturnValue({
      update: mockUpdate
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
});
