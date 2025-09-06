/**
 * Pathfinding utilities for Word Chaser
 * Implements DFS algorithm to find valid word paths on the grid
 */

import { getAdjacentPositions, isValidPosition } from './grid-generation';

export interface GridPosition {
  row: number;
  col: number;
}

export interface PathfindingOptions {
  allowDiagonals?: boolean;
  minLength?: number;
  maxLength?: number;
  allowReuse?: boolean;
}

/**
 * Find all possible paths that form the given word on the grid
 */
export function findWordPaths(
  grid: string[][],
  word: string,
  options: PathfindingOptions = {}
): GridPosition[][] {
  const {
    allowDiagonals = true,
    minLength = 3,
    maxLength = 16,
    allowReuse = false
  } = options;

  if (!word || word.length < minLength || word.length > maxLength) {
    return [];
  }

  const targetWord = word.toUpperCase();
  const paths: GridPosition[][] = [];

  // Find all starting positions that match the first letter
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === targetWord[0]) {
        const path = findPathFromPosition(
          grid,
          targetWord,
          [{ row, col }],
          allowDiagonals,
          allowReuse
        );
        if (path.length === targetWord.length) {
          paths.push(path);
        }
      }
    }
  }

  return paths;
}

/**
 * Find a path starting from a specific position
 */
function findPathFromPosition(
  grid: string[][],
  targetWord: string,
  currentPath: GridPosition[],
  allowDiagonals: boolean,
  allowReuse: boolean
): GridPosition[] {
  const currentLength = currentPath.length;
  
  // Base case: we've found the complete word
  if (currentLength === targetWord.length) {
    return [...currentPath];
  }

  const currentPos = currentPath[currentLength - 1];
  const nextLetter = targetWord[currentLength];
  
  // Get adjacent positions
  const adjacentPositions = allowDiagonals 
    ? getAdjacentPositions(currentPos.row, currentPos.col)
    : getOrthogonalPositions(currentPos.row, currentPos.col);

  // Try each adjacent position
  for (const nextPos of adjacentPositions) {
    // Check bounds
    if (!isValidPosition(grid, nextPos.row, nextPos.col)) {
      continue;
    }

    // Check if position matches next letter
    if (grid[nextPos.row][nextPos.col] !== nextLetter) {
      continue;
    }

    // Check if position is already used (unless reuse is allowed)
    if (!allowReuse && isPositionInPath(nextPos, currentPath)) {
      continue;
    }

    // Recursively search from this position
    const newPath = [...currentPath, nextPos];
    const result = findPathFromPosition(
      grid,
      targetWord,
      newPath,
      allowDiagonals,
      allowReuse
    );

    if (result.length === targetWord.length) {
      return result;
    }
  }

  return currentPath; // Return partial path if no complete path found
}

/**
 * Get only orthogonal (non-diagonal) adjacent positions
 */
function getOrthogonalPositions(row: number, col: number): GridPosition[] {
  return [
    { row: row - 1, col }, // up
    { row: row + 1, col }, // down
    { row, col: col - 1 }, // left
    { row, col: col + 1 }  // right
  ];
}

/**
 * Check if a position is already in the path
 */
function isPositionInPath(position: GridPosition, path: GridPosition[]): boolean {
  return path.some(p => p.row === position.row && p.col === position.col);
}

/**
 * Find the best path for a word (first valid path found)
 */
export function findBestWordPath(
  grid: string[][],
  word: string,
  options: PathfindingOptions = {}
): GridPosition[] | null {
  const paths = findWordPaths(grid, word, options);
  return paths.length > 0 ? paths[0] : null;
}

/**
 * Check if a word can be formed on the grid
 */
export function canFormWord(
  grid: string[][],
  word: string,
  options: PathfindingOptions = {}
): boolean {
  return findWordPaths(grid, word, options).length > 0;
}

/**
 * Validate that a path forms a valid word on the grid
 */
export function validatePath(
  grid: string[][],
  path: GridPosition[]
): { isValid: boolean; word: string; error?: string } {
  if (path.length === 0) {
    return { isValid: false, word: '', error: 'Empty path' };
  }

  // Check that all positions are valid
  for (const pos of path) {
    if (!isValidPosition(grid, pos.row, pos.col)) {
      return { isValid: false, word: '', error: 'Invalid position in path' };
    }
  }

  // Check that positions are adjacent
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const distance = Math.max(
      Math.abs(curr.row - prev.row),
      Math.abs(curr.col - prev.col)
    );
    
    if (distance !== 1) {
      return { isValid: false, word: '', error: 'Non-adjacent positions in path' };
    }
  }

  // Build the word
  const word = path.map(pos => grid[pos.row][pos.col]).join('');

  return { isValid: true, word };
}

/**
 * Get the next valid positions from a current path
 */
export function getNextValidPositions(
  grid: string[][],
  currentPath: GridPosition[],
  allowDiagonals: boolean = true,
  allowReuse: boolean = false
): GridPosition[] {
  if (currentPath.length === 0) {
    // Return all positions if no current path
    const positions: GridPosition[] = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        positions.push({ row, col });
      }
    }
    return positions;
  }

  const lastPos = currentPath[currentPath.length - 1];
  const adjacentPositions = allowDiagonals
    ? getAdjacentPositions(lastPos.row, lastPos.col)
    : getOrthogonalPositions(lastPos.row, lastPos.col);

  return adjacentPositions.filter(pos => {
    if (!isValidPosition(grid, pos.row, pos.col)) {
      return false;
    }

    if (!allowReuse && isPositionInPath(pos, currentPath)) {
      return false;
    }

    return true;
  });
}

