import {
  generateLetterGrid,
  validateGridQuality,
  getGridSizeConfig,
  isValidPosition,
  getAdjacentPositions
} from '../grid-generation';

describe('Grid Generation', () => {
  describe('generateLetterGrid', () => {
    it('should generate a 4x4 grid using Boggle strategy', () => {
      const grid = generateLetterGrid(4);
      
      expect(grid).toHaveLength(4);
      expect(grid[0]).toHaveLength(4);
      expect(grid[1]).toHaveLength(4);
      expect(grid[2]).toHaveLength(4);
      expect(grid[3]).toHaveLength(4);
      
      // All cells should contain single uppercase letters
      grid.forEach(row => {
        row.forEach(cell => {
          expect(cell).toMatch(/^[A-Z]$/);
        });
      });
    });

    it('should generate a 6x6 grid using Boggle strategy', () => {
      const grid = generateLetterGrid(6);
      
      expect(grid).toHaveLength(6);
      grid.forEach(row => {
        expect(row).toHaveLength(6);
        row.forEach(cell => {
          expect(cell).toMatch(/^[A-Z]$/);
        });
      });
    });


    it('should accept options parameter for future enhancements', () => {
      const grid = generateLetterGrid(4, { seedWords: ['CAT'] });
      
      expect(grid).toHaveLength(4);
      grid.forEach(row => {
        expect(row).toHaveLength(4);
      });
    });
  });

  describe('validateGridQuality', () => {
    it('should validate a good quality grid', () => {
      const goodGrid = [
        ['T', 'H', 'E', 'R'],
        ['A', 'N', 'D', 'O'],
        ['I', 'N', 'G', 'S'],
        ['T', 'O', 'N', 'E']
      ];
      
      expect(validateGridQuality(goodGrid)).toBe(true);
    });

    it('should reject a poor quality grid', () => {
      const poorGrid = [
        ['X', 'Q', 'Z', 'J'],
        ['K', 'V', 'B', 'P'],
        ['W', 'F', 'G', 'H'],
        ['M', 'N', 'L', 'R']
      ];
      
      expect(validateGridQuality(poorGrid, 10)).toBe(false);
    });

    it('should accept grids with minimum word patterns', () => {
      const grid = [
        ['T', 'H', 'E', 'A'],
        ['N', 'D', 'I', 'N'],
        ['G', 'O', 'R', 'S'],
        ['T', 'O', 'N', 'E']
      ];
      
      expect(validateGridQuality(grid, 1)).toBe(true);
    });
  });

  describe('getGridSizeConfig', () => {
    it('should return correct sizes for each grid type', () => {
      expect(getGridSizeConfig('small')).toBe(4);
      expect(getGridSizeConfig('medium')).toBe(6);
    });
  });

  describe('isValidPosition', () => {
    const grid = [
      ['A', 'B', 'C'],
      ['D', 'E', 'F'],
      ['G', 'H', 'I']
    ];

    it('should validate positions within bounds', () => {
      expect(isValidPosition(grid, 0, 0)).toBe(true);
      expect(isValidPosition(grid, 1, 1)).toBe(true);
      expect(isValidPosition(grid, 2, 2)).toBe(true);
    });

    it('should reject positions outside bounds', () => {
      expect(isValidPosition(grid, -1, 0)).toBe(false);
      expect(isValidPosition(grid, 0, -1)).toBe(false);
      expect(isValidPosition(grid, 3, 0)).toBe(false);
      expect(isValidPosition(grid, 0, 3)).toBe(false);
      expect(isValidPosition(grid, 3, 3)).toBe(false);
    });
  });

  describe('getAdjacentPositions', () => {
    it('should return all 8 adjacent positions', () => {
      const positions = getAdjacentPositions(1, 1);
      
      expect(positions).toHaveLength(8);
      
      const expectedPositions = [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
        { row: 1, col: 0 },                     { row: 1, col: 2 },
        { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }
      ];
      
      expectedPositions.forEach(expected => {
        expect(positions).toContainEqual(expected);
      });
    });

    it('should return all 8 positions for any cell (including out-of-bounds)', () => {
      const topLeft = getAdjacentPositions(0, 0);
      expect(topLeft).toHaveLength(8);
      
      // Should include both valid and invalid positions
      expect(topLeft).toContainEqual({ row: -1, col: -1 }); // out of bounds
      expect(topLeft).toContainEqual({ row: 0, col: 1 });   // valid
      expect(topLeft).toContainEqual({ row: 1, col: 0 });   // valid
      expect(topLeft).toContainEqual({ row: 1, col: 1 });   // valid
    });

    it('should return consistent 8 positions for any cell', () => {
      const topEdge = getAdjacentPositions(0, 1);
      expect(topEdge).toHaveLength(8);
      
      // Should always return 8 positions regardless of grid bounds
      const center = getAdjacentPositions(1, 1);
      expect(center).toHaveLength(8);
    });
  });
});

