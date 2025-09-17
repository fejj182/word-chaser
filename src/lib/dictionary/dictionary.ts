/**
 * Dictionary utilities for Word Chaser
 * Provides Trie-based word validation with Web Worker support
 */

import { DEFAULT_WORD_LIST } from './word-list';

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

// Global dictionary instance
let dictionary: DictionaryAdapter | null = null;

/**
 * Initialize the dictionary with the specified word list
 */
export function initializeDictionary(words: string[] = DEFAULT_WORD_LIST): void {
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
