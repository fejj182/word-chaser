import {
  findWordPaths,
  findBestWordPath,
  canFormWord,
  validatePath,
  getNextValidPositions,
  GridPosition
} from '../pathfinding';

describe('Pathfinding', () => {
  const testGrid = [
    ['C', 'A', 'T', 'S'],
    ['A', 'R', 'E', 'A'],
    ['T', 'E', 'N', 'D'],
    ['S', 'A', 'D', 'E']
  ];

  describe('findWordPaths', () => {
    it('should find valid paths for existing words', () => {
      const paths = findWordPaths(testGrid, 'CAT');
      
      expect(paths.length).toBeGreaterThan(0);
      
      // Check that each path forms the word
      paths.forEach(path => {
        const word = path.map(pos => testGrid[pos.row][pos.col]).join('');
        expect(word).toBe('CAT');
        
        // Check that positions are adjacent
        for (let i = 1; i < path.length; i++) {
          const prev = path[i - 1];
          const curr = path[i];
          const distance = Math.max(
            Math.abs(curr.row - prev.row),
            Math.abs(curr.col - prev.col)
          );
          expect(distance).toBe(1);
        }
      });
    });

    it('should return empty array for non-existent words', () => {
      const paths = findWordPaths(testGrid, 'XYZ');
      expect(paths).toHaveLength(0);
    });

    it('should respect minimum length constraint', () => {
      const paths = findWordPaths(testGrid, 'CA', { minLength: 3 });
      expect(paths).toHaveLength(0);
    });

    it('should work with diagonal adjacency', () => {
      const paths = findWordPaths(testGrid, 'SET', { allowDiagonals: true });
      
      if (paths.length > 0) {
        // Check that the path uses diagonal moves
        const path = paths[0];
        let hasDiagonal = false;
        
        for (let i = 1; i < path.length; i++) {
          const prev = path[i - 1];
          const curr = path[i];
          const rowDiff = Math.abs(curr.row - prev.row);
          const colDiff = Math.abs(curr.col - prev.col);
          
          if (rowDiff === 1 && colDiff === 1) {
            hasDiagonal = true;
            break;
          }
        }
        
        expect(hasDiagonal).toBe(true);
      }
    });

    it('should work without diagonal adjacency', () => {
      const paths = findWordPaths(testGrid, 'CAR', { allowDiagonals: false });
      
      if (paths.length > 0) {
        const path = paths[0];
        
        // Check that no diagonal moves are used
        for (let i = 1; i < path.length; i++) {
          const prev = path[i - 1];
          const curr = path[i];
          const rowDiff = Math.abs(curr.row - prev.row);
          const colDiff = Math.abs(curr.col - prev.col);
          
          expect(rowDiff + colDiff).toBe(1); // Only orthogonal moves
        }
      }
    });
  });

  describe('findBestWordPath', () => {
    it('should return the first valid path', () => {
      const path = findBestWordPath(testGrid, 'CAT');
      
      if (path) {
        expect(path).toHaveLength(3);
        const word = path.map(pos => testGrid[pos.row][pos.col]).join('');
        expect(word).toBe('CAT');
      }
    });

    it('should return null for non-existent words', () => {
      const path = findBestWordPath(testGrid, 'XYZ');
      expect(path).toBeNull();
    });
  });

  describe('canFormWord', () => {
    it('should return true for formable words', () => {
      expect(canFormWord(testGrid, 'CAT')).toBe(true);
      expect(canFormWord(testGrid, 'ARE')).toBe(true);
    });

    it('should return false for non-formable words', () => {
      expect(canFormWord(testGrid, 'XYZ')).toBe(false);
      expect(canFormWord(testGrid, 'QQQ')).toBe(false);
    });
  });

  describe('validatePath', () => {
    it('should validate a correct path', () => {
      const path: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 }
      ];
      
      const result = validatePath(testGrid, path);
      
      expect(result.isValid).toBe(true);
      expect(result.word).toBe('CAT');
    });

    it('should reject empty path', () => {
      const result = validatePath(testGrid, []);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty path');
    });

    it('should reject path with invalid positions', () => {
      const path: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 10 } // Invalid position
      ];
      
      const result = validatePath(testGrid, path);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid position in path');
    });

    it('should reject path with non-adjacent positions', () => {
      const path: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 2, col: 2 } // Not adjacent to previous position
      ];
      
      const result = validatePath(testGrid, path);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Non-adjacent positions in path');
    });
  });

  describe('getNextValidPositions', () => {
    it('should return all positions for empty path', () => {
      const positions = getNextValidPositions(testGrid, []);
      
      expect(positions).toHaveLength(16); // 4x4 grid
    });

    it('should return adjacent positions for single position', () => {
      const path: GridPosition[] = [{ row: 1, col: 1 }];
      const positions = getNextValidPositions(testGrid, path, true, false);
      
      expect(positions).toHaveLength(8); // All 8 adjacent positions
    });

    it('should exclude used positions when reuse is not allowed', () => {
      const path: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 }
      ];
      const positions = getNextValidPositions(testGrid, path, true, false);
      
      // Should not include the already used positions
      expect(positions).not.toContainEqual({ row: 0, col: 0 });
      expect(positions).not.toContainEqual({ row: 0, col: 1 });
    });

    it('should include used positions when reuse is allowed', () => {
      const path: GridPosition[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 }
      ];
      const positions = getNextValidPositions(testGrid, path, true, true);
      
      // Should include the already used positions
      expect(positions).toContainEqual({ row: 0, col: 0 });
      expect(positions).toContainEqual({ row: 0, col: 2 });
    });

    it('should return only orthogonal positions when diagonals are disabled', () => {
      const path: GridPosition[] = [{ row: 1, col: 1 }];
      const positions = getNextValidPositions(testGrid, path, false, false);
      
      expect(positions).toHaveLength(4); // Only orthogonal positions
      expect(positions).toContainEqual({ row: 0, col: 1 }); // up
      expect(positions).toContainEqual({ row: 2, col: 1 }); // down
      expect(positions).toContainEqual({ row: 1, col: 0 }); // left
      expect(positions).toContainEqual({ row: 1, col: 2 }); // right
    });
  });
});

