// Mock NextRequest before importing the route
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200
    }))
  }
}));

import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the word validation function
jest.mock('@/lib/word-validation', () => ({
  validateWordSubmission: jest.fn()
}));

// Mock the admin room utils function
jest.mock('@/lib/firebase/admin-room-utils', () => ({
  updatePlayerScoreAdmin: jest.fn(),
  addSubmittedWordAdmin: jest.fn(),
  isWordAlreadySubmittedAdmin: jest.fn(),
  getRoom: jest.fn()
}));

import { validateWordSubmission } from '@/lib/word-validation';
import { updatePlayerScoreAdmin, addSubmittedWordAdmin, isWordAlreadySubmittedAdmin, getRoom } from '@/lib/firebase/admin-room-utils';

describe('/api/validate-word', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates word successfully', async () => {
    const mockValidation = {
      isValid: true,
      score: 30,
      path: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    };

    (validateWordSubmission as jest.Mock).mockReturnValue(mockValidation);
    (isWordAlreadySubmittedAdmin as jest.Mock).mockResolvedValue(false);
    (getRoom as jest.Mock).mockResolvedValue({
      players: {
        'user123': {
          displayName: 'Test User'
        }
      }
    });
    (addSubmittedWordAdmin as jest.Mock).mockResolvedValue(undefined);
    (updatePlayerScoreAdmin as jest.Mock).mockResolvedValue(undefined);

    const requestBody = {
      word: 'cat',
      roomId: 'room123',
      userId: 'user123',
      boardLetters: [['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']]
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.isValid).toBe(mockValidation.isValid);
    expect(data.result.score).toBe(mockValidation.score);
    expect(data.result.path).toBeDefined();
    expect(isWordAlreadySubmittedAdmin).toHaveBeenCalledWith('room123', 'cat');
    expect(validateWordSubmission).toHaveBeenCalledWith('cat', requestBody.boardLetters, {
      allowReuse: false,
      minLength: 3
    });
    expect(addSubmittedWordAdmin).toHaveBeenCalledWith('room123', 'cat', 'user123', 'Test User', 30);
    expect(updatePlayerScoreAdmin).toHaveBeenCalledWith('room123', 'user123', 30);
  });

  it('returns error when word is already submitted', async () => {
    (isWordAlreadySubmittedAdmin as jest.Mock).mockResolvedValue(true);

    const requestBody = {
      word: 'cat',
      roomId: 'room123',
      userId: 'user123',
      boardLetters: [['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']]
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.result.isValid).toBe(false);
    expect(data.result.reason).toBe('Word has already been submitted');
    expect(data.error).toBe('Word has already been submitted');
    expect(validateWordSubmission).not.toHaveBeenCalled();
    expect(updatePlayerScoreAdmin).not.toHaveBeenCalled();
  });

  it('returns error for missing required fields', async () => {
    const requestBody = {
      word: 'cat',
      // Missing roomId, userId, boardLetters
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Missing required fields');
    expect(validateWordSubmission).not.toHaveBeenCalled();
  });

  it('returns error for empty word', async () => {
    const requestBody = {
      word: '',
      roomId: 'room123',
      userId: 'user123',
      boardLetters: [['A', 'B', 'C', 'D']]
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Missing required fields');
  });

  it('handles validation errors gracefully', async () => {
    const mockValidation = {
      isValid: false,
      score: 0,
      reason: 'Word not found in dictionary'
    };

    (validateWordSubmission as jest.Mock).mockReturnValue(mockValidation);
    (isWordAlreadySubmittedAdmin as jest.Mock).mockResolvedValue(false);

    const requestBody = {
      word: 'invalid',
      roomId: 'room123',
      userId: 'user123',
      boardLetters: [['A', 'B', 'C', 'D']]
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.isValid).toBe(mockValidation.isValid);
    expect(data.result.score).toBe(mockValidation.score);
    expect(updatePlayerScoreAdmin).not.toHaveBeenCalled();
  });

  it('handles internal server errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (isWordAlreadySubmittedAdmin as jest.Mock).mockResolvedValue(false);
    (validateWordSubmission as jest.Mock).mockImplementation(() => {
      throw new Error('Internal error');
    });

    const requestBody = {
      word: 'cat',
      roomId: 'room123',
      userId: 'user123',
      boardLetters: [['A', 'B', 'C', 'D']]
    };

    const request = {
      method: 'POST',
      json: async () => requestBody
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');

    consoleErrorSpy.mockRestore();
  });
});
