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

import { validateWordSubmission } from '@/lib/word-validation';

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

    const requestBody = {
      word: 'cat',
      roomId: 'room123',
      playerId: 'player123',
      playerName: 'TestPlayer',
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
    expect(validateWordSubmission).toHaveBeenCalledWith('cat', requestBody.boardLetters, {
      allowReuse: false,
      minLength: 3
    });
  });

  it('returns error for missing required fields', async () => {
    const requestBody = {
      word: 'cat',
      // Missing roomId, playerId, playerName, boardLetters
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
      playerId: 'player123',
      playerName: 'TestPlayer',
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

    const requestBody = {
      word: 'invalid',
      roomId: 'room123',
      playerId: 'player123',
      playerName: 'TestPlayer',
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
  });

  it('handles internal server errors', async () => {
    (validateWordSubmission as jest.Mock).mockImplementation(() => {
      throw new Error('Internal error');
    });

    const requestBody = {
      word: 'cat',
      roomId: 'room123',
      playerId: 'player123',
      playerName: 'TestPlayer',
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
  });
});
