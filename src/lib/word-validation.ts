import { isValidWord, calculateWordScore } from './dictionary';

export interface BoardPosition {
  row: number;
  col: number;
}

export interface WordValidationOptions {
  allowReuse: boolean; // Whether to allow reusing letters within the same word
  minLength: number;
}

export const validateWordOnBoard = (
  word: string,
  boardLetters: string[][],
  options: WordValidationOptions = { allowReuse: false, minLength: 3 }
): { isValid: boolean; reason?: string; path?: BoardPosition[] } => {
  const cleanWord = word.toLowerCase().trim();
  
  // Check minimum length
  if (cleanWord.length < options.minLength) {
    return { isValid: false, reason: `Word must be at least ${options.minLength} letters long` };
  }
  
  // Check if word exists in dictionary
  if (!isValidWord(cleanWord)) {
    return { isValid: false, reason: 'Word not found in dictionary' };
  }
  
  // Check if word can be formed on the board
  const path = findWordPath(cleanWord, boardLetters, options.allowReuse);
  if (!path) {
    return { isValid: false, reason: 'Word cannot be formed on the board' };
  }
  
  return { isValid: true, path };
};

const findWordPath = (
  word: string,
  boardLetters: string[][],
  allowReuse: boolean
): BoardPosition[] | null => {
  const rows = boardLetters.length;
  const cols = boardLetters[0]?.length || 0;
  
  if (rows === 0 || cols === 0) return null;
  
  // Try to find the word starting from each position on the board
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (boardLetters[row][col]?.toLowerCase() === word[0]) {
        const path = findWordPathFromPosition(word, boardLetters, row, col, allowReuse);
        if (path) return path;
      }
    }
  }
  
  return null;
};

const findWordPathFromPosition = (
  word: string,
  boardLetters: string[][],
  startRow: number,
  startCol: number,
  allowReuse: boolean
): BoardPosition[] | null => {
  const rows = boardLetters.length;
  const cols = boardLetters[0]?.length || 0;
  
  // Directions: up, down, left, right, and diagonals
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  const dfs = (
    currentRow: number,
    currentCol: number,
    wordIndex: number,
    visited: Set<string>,
    path: BoardPosition[]
  ): BoardPosition[] | null => {
    // Check bounds
    if (currentRow < 0 || currentRow >= rows || currentCol < 0 || currentCol >= cols) {
      return null;
    }
    
    // Check if we've reached the end of the word
    if (wordIndex === word.length) {
      return [...path];
    }
    
    // Check if current position matches the current letter
    if (boardLetters[currentRow][currentCol]?.toLowerCase() !== word[wordIndex]) {
      return null;
    }
    
    // Create position key for visited tracking
    const posKey = `${currentRow},${currentCol}`;
    
    // Check if we've already visited this position (if not allowing reuse)
    if (!allowReuse && visited.has(posKey)) {
      return null;
    }
    
    // Add current position to path and visited set
    const newPath = [...path, { row: currentRow, col: currentCol }];
    const newVisited = new Set(visited);
    newVisited.add(posKey);
    
    // If this is the last letter, we found the word
    if (wordIndex === word.length - 1) {
      return newPath;
    }
    
    // Try all directions for the next letter
    for (const [dRow, dCol] of directions) {
      const nextRow = currentRow + dRow;
      const nextCol = currentCol + dCol;
      
      const result = dfs(nextRow, nextCol, wordIndex + 1, newVisited, newPath);
      if (result) return result;
    }
    
    return null;
  };
  
  return dfs(startRow, startCol, 0, new Set(), []);
};

export const validateWordSubmission = (
  word: string,
  boardLetters: string[][],
  options: WordValidationOptions = { allowReuse: false, minLength: 3 }
): { isValid: boolean; score: number; reason?: string; path?: BoardPosition[] } => {
  const validation = validateWordOnBoard(word, boardLetters, options);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      score: 0,
      reason: validation.reason
    };
  }
  
  const score = calculateWordScore(word);
  
  return {
    isValid: true,
    score,
    path: validation.path
  };
};

