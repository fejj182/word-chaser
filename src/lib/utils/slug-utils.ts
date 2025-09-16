/**
 * Utility functions for generating and processing slugs
 */

/**
 * Converts a string to a URL-friendly slug format
 * @param input - The string to slugify
 * @returns A slugified version of the input string
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generates a random Glaswegian-style slug with two words and a number
 * @returns A string in the format "word1-word2-123"
 */
export function generateGlaswegianSlug(): string {
  const glaswegianWords = [
    'wee', 'daftie', 'bampot', 'heid', 'bawbag', 'gallus', 'pure', 'dead', 'manky', 'scunner',
    'boggin', 'mingin', 'braw', 'bonnie', 'crabbit', 'dreich', 'fankle', 'glaikit', 'witnaw', 'tube',
    'malky', 'numpty', 'tadger', 'chap', 'scunner', 'awrite', 'skelf', 'jaiket', 'stoater', 'rapid'
  ];
  const word1 = glaswegianWords[Math.floor(Math.random() * glaswegianWords.length)];
  const word2 = glaswegianWords[Math.floor(Math.random() * glaswegianWords.length)];
  const number = Math.floor(100 + Math.random() * 900); // 3 digits
  return `${word1}-${word2}-${number}`;
}
