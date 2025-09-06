/**
 * Dictionary utilities for Word Chaser
 * Provides Trie-based word validation with Web Worker support
 */

// Trie node structure
interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word?: string;
}

// Dictionary adapter interface
export interface DictionaryAdapter {
  isValidWord(word: string): boolean;
}

// Trie-based dictionary (recommended)
class TrieDictionary implements DictionaryAdapter {
  private root: TrieNode;
  private wordCount: number;

  constructor(words: string[] = []) {
    this.root = { children: new Map(), isEndOfWord: false };
    this.wordCount = 0;
    this.buildTrie(words);
  }

  private buildTrie(words: string[]): void {
    for (const word of words) {
      this.insertWord(word.toLowerCase().trim());
    }
  }

  private insertWord(word: string): void {
    if (word.length < 3) return;

    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, { children: new Map(), isEndOfWord: false });
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    current.word = word;
    this.wordCount++;
  }

  isValidWord(word: string): boolean {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length < 3) return false;

    let current = this.root;
    for (const char of cleanWord) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }

}

// Default word list (expanded from original)
const DEFAULT_WORDS = [
  // Original words
  'abc', 'aei', 'afk', 'bac', 'fak', 'afp', 'abcd', 'abcdh', 'abcdhg', 'abcdhgf', 'zed',
  
  // Common 3-letter words
  'cat', 'dog', 'run', 'sun', 'fun', 'big', 'red', 'blue', 'green', 'black', 'white',
  'car', 'bus', 'air', 'sea', 'land', 'tree', 'book', 'hand', 'foot', 'eye', 'ear',
  'hat', 'bag', 'cup', 'pen', 'key', 'door', 'wall', 'floor', 'table', 'chair',
  
  // Common 4-letter words
  'love', 'hope', 'life', 'time', 'work', 'play', 'game', 'home', 'food', 'water',
  'fire', 'wind', 'rain', 'snow', 'moon', 'star', 'bird', 'fish', 'bear', 'lion',
  'tree', 'leaf', 'root', 'seed', 'grow', 'walk', 'talk', 'read', 'write', 'draw',
  
  // Common 5-letter words
  'happy', 'peace', 'dream', 'light', 'night', 'morning', 'evening', 'winter', 'summer',
  'spring', 'autumn', 'music', 'dance', 'smile', 'laugh', 'think', 'learn', 'teach',
  'build', 'create', 'design', 'paint', 'color', 'shape', 'sound', 'voice', 'heart',
  
  // Common 6-letter words
  'beautiful', 'wonderful', 'amazing', 'fantastic', 'perfect', 'special', 'unique',
  'family', 'friend', 'person', 'people', 'world', 'nature', 'forest', 'garden',
  'flower', 'butterfly', 'dragon', 'castle', 'palace', 'temple', 'church', 'school',
  
  // Common 7+ letter words
  'adventure', 'journey', 'explore', 'discover', 'imagine', 'remember', 'celebrate',
  'happiness', 'kindness', 'freedom', 'courage', 'wisdom', 'knowledge', 'experience',
  'challenge', 'opportunity', 'possibility', 'creativity', 'imagination', 'inspiration'
];

// Global dictionary instance
let dictionary: DictionaryAdapter | null = null;

/**
 * Initialize the dictionary with the specified word list
 */
export function initializeDictionary(words: string[] = DEFAULT_WORDS): void {
  dictionary = new TrieDictionary(words);
}

/**
 * Get the current dictionary instance
 */
export function getDictionary(): DictionaryAdapter {
  if (!dictionary) {
    initializeDictionary();
  }
  return dictionary!;
}

/**
 * Check if a word is valid
 */
export const isValidWord = (word: string): boolean => {
  return getDictionary().isValidWord(word);
};


/**
 * Calculate word score based on length and bonuses
 */
export const calculateWordScore = (word: string): number => {
  const cleanWord = word.toLowerCase().trim();
  if (!isValidWord(cleanWord)) return 0;
  
  const baseScore = cleanWord.length * 10;
  
  // Bonus for longer words
  if (cleanWord.length >= 8) return baseScore + 100;
  if (cleanWord.length >= 7) return baseScore + 75;
  if (cleanWord.length >= 6) return baseScore + 50;
  if (cleanWord.length >= 5) return baseScore + 25;
  
  return baseScore;
};


// Initialize with default dictionary
initializeDictionary();
