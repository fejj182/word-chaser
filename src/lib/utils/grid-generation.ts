/**
 * Grid generation utilities for Word Chaser
 * Implements Boggle-style letter distributions for better word yield
 */

import { GridSize } from "@/features/game-play/contexts/GamePlayContext";

// Boggle dice configurations (4x4 grid uses 16 dice)
const BOGGLE_DICE_4X4 = [
  ['A', 'A', 'E', 'E', 'G', 'N'],
  ['E', 'L', 'R', 'T', 'T', 'Y'],
  ['A', 'O', 'O', 'T', 'T', 'W'],
  ['A', 'B', 'B', 'J', 'O', 'O'],
  ['E', 'H', 'R', 'T', 'V', 'W'],
  ['C', 'I', 'M', 'O', 'T', 'U'],
  ['D', 'I', 'S', 'T', 'T', 'Y'],
  ['E', 'I', 'O', 'S', 'S', 'T'],
  ['D', 'E', 'L', 'R', 'V', 'Y'],
  ['A', 'C', 'H', 'O', 'P', 'S'],
  ['H', 'I', 'M', 'N', 'Q', 'U'],
  ['E', 'E', 'I', 'N', 'S', 'U'],
  ['E', 'E', 'G', 'H', 'N', 'W'],
  ['A', 'F', 'F', 'K', 'P', 'S'],
  ['H', 'L', 'N', 'N', 'R', 'Z'],
  ['D', 'E', 'I', 'L', 'R', 'X']
];

// Extended dice for 6x6 grid (36 dice)
const BOGGLE_DICE_6X6 = [
  ...BOGGLE_DICE_4X4,
  // Additional dice for 6x6
  ['A', 'A', 'F', 'I', 'R', 'S'],
  ['A', 'D', 'E', 'N', 'N', 'N'],
  ['A', 'E', 'E', 'E', 'E', 'M'],
  ['A', 'E', 'G', 'M', 'N', 'N'],
  ['A', 'E', 'I', 'L', 'M', 'N'],
  ['A', 'E', 'I', 'N', 'O', 'U'],
  ['A', 'F', 'I', 'R', 'S', 'Y'],
  ['B', 'J', 'K', 'Q', 'X', 'Z'],
  ['C', 'C', 'E', 'N', 'S', 'T'],
  ['C', 'E', 'I', 'I', 'L', 'T'],
  ['C', 'E', 'I', 'P', 'S', 'T'],
  ['D', 'D', 'H', 'N', 'O', 'T'],
  ['D', 'H', 'H', 'L', 'O', 'R'],
  ['D', 'H', 'L', 'N', 'O', 'R'],
  ['D', 'H', 'L', 'N', 'O', 'R'],
  ['E', 'I', 'I', 'I', 'T', 'T'],
  ['E', 'M', 'O', 'T', 'T', 'T'],
  ['E', 'N', 'S', 'S', 'S', 'U'],
  ['F', 'I', 'P', 'R', 'S', 'Y'],
  ['G', 'O', 'R', 'R', 'V', 'W']
];

export interface GridGenerationOptions {
  seedWords?: string[];
}

/**
 * Generate a letter grid using Boggle-style dice distributions
 */
export function generateLetterGrid(
  size: number,
  options: GridGenerationOptions = {}
): string[][] {
  const { seedWords: _seedWords = []} = options;
  
  const testGrid = getTestGridIfProvided();
  if (testGrid) {
    return testGrid;
  }
  
  // For now, we only support Boggle strategy
  // seedWords are reserved for future enhancements
  return generateBoggleGrid(size);
}

/**
 * Get test grid from environment variable or URL (for e2e tests)
 */
function getTestGridIfProvided(): string[][] | null {
  if (typeof window === 'undefined' || !window.location.hostname.includes('localhost')) return null;
  
  let testGridParam = new URLSearchParams(window.location.search).get('testGrid');

  if (!testGridParam) {
    testGridParam = localStorage.getItem('testGrid');
  } else {
    localStorage.setItem('testGrid', testGridParam);
  }

  if (!testGridParam) return null;
  
  try {
    const grid = JSON.parse(testGridParam);
    if (Array.isArray(grid) && grid.every(row => Array.isArray(row))) {
      return grid;
    }
  } catch (error) {
    console.warn('Invalid testGrid parameter:', error);
  }
  
  return null;
}

/**
 * Generate a grid using Boggle-style dice distributions
 */
function generateBoggleGrid(size: number): string[][] {
  const dice = size === 4 ? BOGGLE_DICE_4X4 : BOGGLE_DICE_6X6;
  const grid: string[][] = [];
  
  // Shuffle dice positions
  const shuffledDice = [...dice].sort(() => Math.random() - 0.5);
  
  for (let row = 0; row < size; row++) {
    const gridRow: string[] = [];
    for (let col = 0; col < size; col++) {
      const dieIndex = row * size + col;
      const die = shuffledDice[dieIndex] || shuffledDice[0];
      const randomFace = die[Math.floor(Math.random() * die.length)];
      gridRow.push(randomFace);
    }
    grid.push(gridRow);
  }
  
  return grid;
}


/**
 * TODO: Validate that a grid has reasonable word potential
 */
export function validateGridQuality(grid: string[][], minWords: number = 5): boolean {
  // Simple heuristic: check for common letter combinations
  const flatGrid = grid.flat().join('').toLowerCase();
  const commonPatterns = ['th', 'he', 'in', 'er', 'an', 're', 'ed', 'nd', 'on', 'en', 'at', 'ou', 'it', 'is', 'or', 'ti', 'as', 'to', 'be', 'of', 'and', 'have', 'this', 'that', 'with', 'for', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'oil', 'sit', 'try', 'use', 'war', 'end', 'why', 'let', 'put', 'say', 'she', 'too', 'use'];
  
  let patternCount = 0;
  for (const pattern of commonPatterns) {
    if (flatGrid.includes(pattern)) {
      patternCount++;
    }
  }
  
  return patternCount >= minWords;
}

/**
 * Get grid size configuration
 */
export function getGridSizeConfig(size: GridSize): number {
  switch (size) {
    case 'small': return 4;
    case 'medium': return 6;
    default: return 4;
  }
}

/**
 * Check if a position is within grid bounds
 */
export function isValidPosition(grid: string[][], row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

/**
 * Get all adjacent positions (8-directional)
 */
export function getAdjacentPositions(row: number, col: number): Array<{row: number; col: number}> {
  const positions = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      positions.push({ row: row + dr, col: col + dc });
    }
  }
  return positions;
}
