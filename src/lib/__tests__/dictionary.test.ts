import {
  isValidWord,
  calculateWordScore,
  initializeDictionary,
  getDictionary
} from '../dictionary/dictionary';

describe('Dictionary', () => {
  beforeEach(() => {
    // Reset dictionary to default state
    initializeDictionary();
  });

  describe('isValidWord', () => {
    it('should validate existing words', () => {
      expect(isValidWord('cat')).toBe(true);
      expect(isValidWord('dog')).toBe(true);
      expect(isValidWord('love')).toBe(true);
      expect(isValidWord('happy')).toBe(true);
    });

    it('should reject non-existent words', () => {
      expect(isValidWord('xyz')).toBe(false);
      expect(isValidWord('qqq')).toBe(false);
      expect(isValidWord('notaword')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isValidWord('CAT')).toBe(true);
      expect(isValidWord('Cat')).toBe(true);
      expect(isValidWord('cAt')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(isValidWord(' cat ')).toBe(true);
      expect(isValidWord('  dog  ')).toBe(true);
    });

    it('should reject words that are too short', () => {
      expect(isValidWord('a')).toBe(false);
      expect(isValidWord('ab')).toBe(false);
    });

    it('should accept words that are exactly 3 characters', () => {
      expect(isValidWord('cat')).toBe(true);
      expect(isValidWord('dog')).toBe(true);
    });
  });

  describe('calculateWordScore', () => {
    it('should return 0 for invalid words', () => {
      expect(calculateWordScore('xyz')).toBe(0);
      expect(calculateWordScore('ab')).toBe(0);
    });

    it('should calculate correct scores for valid words', () => {
      expect(calculateWordScore('cat')).toBe(30); // 3 * 10
      expect(calculateWordScore('love')).toBe(40); // 4 * 10
      expect(calculateWordScore('happy')).toBe(75); // 5 * 10 + 25 bonus
    });

    it('should apply bonuses for longer words', () => {
      expect(calculateWordScore('beautiful')).toBe(190); // 9 * 10 + 100 bonus
      expect(calculateWordScore('amazing')).toBe(145); // 7 * 10 + 75 bonus
      expect(calculateWordScore('family')).toBe(110); // 6 * 10 + 50 bonus
      expect(calculateWordScore('adventure')).toBe(190); // 9 * 10 + 100 bonus
    });

    it('should handle case insensitivity', () => {
      expect(calculateWordScore('CAT')).toBe(30);
      expect(calculateWordScore('Love')).toBe(40);
    });
  });

  describe('initializeDictionary', () => {
    it('should initialize with default word list', () => {
      initializeDictionary();
      const dict = getDictionary();
      expect(dict).toBeDefined();
      expect(dict.isValidWord('cat')).toBe(true);
    });

    it('should initialize with custom word list', () => {
      const customWords = ['test', 'word', 'list'];
      initializeDictionary(customWords);
      
      expect(isValidWord('test')).toBe(true);
      expect(isValidWord('word')).toBe(true);
      expect(isValidWord('list')).toBe(true);
      expect(isValidWord('cat')).toBe(false); // Not in custom list
    });
  });

  describe('getDictionary', () => {
    it('should return a dictionary instance', () => {
      const dict = getDictionary();
      expect(dict).toBeDefined();
      expect(typeof dict.isValidWord).toBe('function');
    });

    it('should auto-initialize if not initialized', () => {
      // This test ensures getDictionary works even without explicit initialization
      const dict = getDictionary();
      expect(dict.isValidWord('cat')).toBe(true);
    });
  });
});