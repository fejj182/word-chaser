import { slugify, generateGlaswegianSlug } from '../slug-utils';

describe('slug-utils', () => {
  describe('slugify', () => {
    it('converts string to lowercase', () => {
      expect(slugify('HELLO WORLD')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
      expect(slugify('Test@#$%^&*()')).toBe('test');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('removes multiple consecutive hyphens', () => {
      expect(slugify('hello--world')).toBe('hello-world');
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('trims whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles string with only special characters', () => {
      expect(slugify('!@#$%^&*()')).toBe('');
    });

    it('preserves numbers', () => {
      expect(slugify('room123')).toBe('room123');
      expect(slugify('test 123 room')).toBe('test-123-room');
    });

    it('handles mixed case and special characters', () => {
      expect(slugify('My Room #1!')).toBe('my-room-1');
    });
  });

  describe('generateGlaswegianSlug', () => {
    it('generates slug with correct format', () => {
      const slug = generateGlaswegianSlug();
      expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
    });

    it('generates different slugs on multiple calls', () => {
      const slugs = Array.from({ length: 10 }, () => generateGlaswegianSlug());
      const uniqueSlugs = new Set(slugs);
      // While it's possible to get duplicates, it's very unlikely with 10 calls
      expect(uniqueSlugs.size).toBeGreaterThan(1);
    });

    it('generates slug with 3-digit number', () => {
      const slug = generateGlaswegianSlug();
      const parts = slug.split('-');
      const number = parseInt(parts[2]);
      expect(number).toBeGreaterThanOrEqual(100);
      expect(number).toBeLessThanOrEqual(999);
    });

    it('generates slug with valid Glaswegian words', () => {
      const glaswegianWords = [
        'wee', 'daftie', 'bampot', 'heid', 'bawbag', 'gallus', 'pure', 'dead', 'manky', 'scunner',
        'boggin', 'mingin', 'braw', 'bonnie', 'crabbit', 'dreich', 'fankle', 'glaikit', 'witnaw', 'tube',
        'malky', 'numpty', 'tadger', 'chap', 'scunner', 'awrite', 'skelf', 'jaiket', 'stoater', 'rapid'
      ];
      
      const slug = generateGlaswegianSlug();
      const parts = slug.split('-');
      const word1 = parts[0];
      const word2 = parts[1];
      
      expect(glaswegianWords).toContain(word1);
      expect(glaswegianWords).toContain(word2);
    });

    it('generates slug with exactly 3 parts', () => {
      const slug = generateGlaswegianSlug();
      const parts = slug.split('-');
      expect(parts).toHaveLength(3);
    });
  });
});
