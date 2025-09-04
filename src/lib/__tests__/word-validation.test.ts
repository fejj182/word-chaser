import { validateWordOnBoard, validateWordSubmission } from '../word-validation';

describe('Word Validation', () => {
  const testBoard = [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G', 'H'],
    ['I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P']
  ];

  describe('validateWordOnBoard', () => {
    it('validates valid words that can be formed on the board', () => {
      // Test horizontal word
      const result1 = validateWordOnBoard('ABC', testBoard);
      expect(result1.isValid).toBe(true);
      expect(result1.path).toBeDefined();

      // Test vertical word
      const result2 = validateWordOnBoard('AEI', testBoard);
      expect(result2.isValid).toBe(true);
      expect(result2.path).toBeDefined();

      // Test diagonal word
      const result3 = validateWordOnBoard('AFK', testBoard);
      expect(result3.isValid).toBe(true);
      expect(result3.path).toBeDefined();
    });

    it('rejects words that cannot be formed on the board', () => {
      // Use a word that exists in dictionary but can't be formed on board
      const result = validateWordOnBoard('zed', testBoard);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Word cannot be formed on the board');
    });

    it('rejects words that are too short', () => {
      const result = validateWordOnBoard('AB', testBoard, { allowReuse: false, minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Word must be at least 3 letters long');
    });

    it('rejects words not in dictionary', () => {
      const result = validateWordOnBoard('XYZ', testBoard);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Word not found in dictionary');
    });
  });

  describe('validateWordSubmission', () => {
    it('returns validation result with score for valid words', () => {
      // Use a word that exists in our dictionary and can be formed on the board
      const result = validateWordSubmission('abc', testBoard);
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.path).toBeDefined();
    });

    it('returns zero score for invalid words', () => {
      const result = validateWordSubmission('invalid', testBoard);
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reason).toBeDefined();
    });
  });

  describe('board path finding', () => {
    it('finds horizontal paths', () => {
      const result = validateWordOnBoard('ABC', testBoard);
      expect(result.isValid).toBe(true);
      expect(result.path).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 }
      ]);
    });

    it('finds vertical paths', () => {
      const result = validateWordOnBoard('AEI', testBoard);
      expect(result.isValid).toBe(true);
      expect(result.path).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 }
      ]);
    });

    it('finds diagonal paths', () => {
      const result = validateWordOnBoard('AFK', testBoard);
      expect(result.isValid).toBe(true);
      expect(result.path).toEqual([
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles empty board', () => {
      const result = validateWordOnBoard('ABC', []);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Word cannot be formed on the board');
    });

    it('handles single row board', () => {
      const singleRowBoard = [['A', 'B', 'C', 'D']];
      const result = validateWordOnBoard('ABC', singleRowBoard);
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('handles case insensitive matching', () => {
      const result = validateWordOnBoard('abc', testBoard);
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });
});
