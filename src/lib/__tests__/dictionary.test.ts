import { DICTIONARY, isValidWord, calculateWordScore } from '../dictionary';

describe('Dictionary', () => {
  describe('isValidWord', () => {
    it('validates valid words', () => {
      expect(isValidWord('abc')).toBe(true);
    });

    it('rejects invalid words', () => {
      expect(isValidWord('xyz')).toBe(false);
      expect(isValidWord('invalid')).toBe(false);
      expect(isValidWord('')).toBe(false);
      expect(isValidWord('ab')).toBe(false); // too short
    });

    it('handles case insensitive validation', () => {
      expect(isValidWord('ABC')).toBe(true);
      expect(isValidWord('Abc')).toBe(true);
      expect(isValidWord('abc')).toBe(true);
    });

    it('trims whitespace', () => {
      expect(isValidWord('  abc  ')).toBe(true);
      expect(isValidWord('\t\tabc\t\t')).toBe(true);
      expect(isValidWord('\n\nabc\n\n')).toBe(true);
    });
  });

  describe('calculateWordScore', () => {
    it('returns 0 for invalid words', () => {
      expect(calculateWordScore('xyz')).toBe(0);
      expect(calculateWordScore('')).toBe(0);
      expect(calculateWordScore('ab')).toBe(0);
    });

    it('calculates base score for valid words', () => {
      expect(calculateWordScore('abc')).toBe(30); // 3 letters * 10
      expect(calculateWordScore('abcd')).toBe(40); // 4 letters * 10
    });

    it('applies bonus for longer words', () => {
      expect(calculateWordScore('abcdh')).toBe(75); // 50 + 25 bonus
      expect(calculateWordScore('abcdhg')).toBe(110); // 60 + 50 bonus
      expect(calculateWordScore('abcdhgf')).toBe(120); // 80 + 50 bonus
    });

    it('handles case insensitive scoring', () => {
      expect(calculateWordScore('ABC')).toBe(30);
      expect(calculateWordScore('Abc')).toBe(30);
      expect(calculateWordScore('abc')).toBe(30);
    });

    it('trims whitespace before scoring', () => {
      expect(calculateWordScore('  abc  ')).toBe(30);
      expect(calculateWordScore('\t\tabc\t\t')).toBe(30);
    });
  });
});
