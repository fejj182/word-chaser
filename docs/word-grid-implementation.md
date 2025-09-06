# Word Grid Implementation

This document describes the implementation of the interactive letter grid feature for Word Chaser, based on the recommendations from the [Word Grid Spike](./spikes/2025-09-04-word-grid-spike.md).

## Overview

The word grid feature provides an N×N interactive letter grid with two-way data binding to a word input field, real English dictionary validation, and comprehensive pathfinding capabilities.

## Architecture

### Core Components

```
src/features/game-play/
├── components/
│   ├── WordGridDemo.tsx          # Complete demo component
│   ├── GridSizeSelector.tsx      # Grid size toggle (4×4, 6×6, 8×8)
│   ├── LetterGrid.tsx            # Interactive grid with path highlighting
│   └── WordInput.tsx             # Two-way bound input with validation
├── contexts/
│   └── GamePlayContext.tsx       # Central state management
├── hooks/
│   ├── useWordPath.ts            # Pathfinding and grid interaction
│   └── useDictionaryWorker.ts    # Web Worker management
└── __tests__/                    # Comprehensive test suite
```

### Supporting Libraries

```
src/lib/
├── dictionary.ts                 # Trie-based dictionary with adapters
├── workers/
│   └── dictionary.worker.ts      # Web Worker for heavy operations
└── utils/
    ├── grid-generation.ts        # Boggle-style grid generation
    └── pathfinding.ts            # DFS pathfinding algorithms
```

## Key Features

### 1. Grid Generation

- **Boggle-style distributions**: Balanced consonant/vowel mix for better word yield
- **Frequency-weighted fallback**: Uses English letter frequency when needed
- **Configurable strategies**: Easy to switch between generation methods
- **Quality validation**: Ensures grids have reasonable word potential

```typescript
// Generate a 6×6 grid with Boggle-style dice
const grid = generateLetterGrid(6, { strategy: 'boggle' });
```

### 2. Two-Way Data Binding

- **Grid → Input**: Clicking letters appends to the word input
- **Input → Grid**: Typing words highlights valid paths on the grid
- **Debounced input**: 150ms delay prevents excessive pathfinding
- **Real-time validation**: Shows word validity and score as you type

### 3. Pathfinding Algorithm

- **DFS with backtracking**: Finds all valid paths for a word
- **8-directional adjacency**: Includes diagonal connections
- **No tile reuse**: Each letter can only be used once per word
- **Early termination**: Stops searching invalid prefixes for performance

```typescript
// Find all possible paths for "CAT" on the grid
const paths = findWordPaths(grid, 'CAT', { allowDiagonals: true });
```

### 4. Dictionary System

- **Trie implementation**: Efficient prefix lookups and word validation
- **Set fallback**: Simple Set-based dictionary for smaller word lists
- **Web Worker support**: Offloads heavy operations to keep UI responsive
- **Expandable**: Easy to load larger dictionaries from external sources

```typescript
// Check if a word is valid
const isValid = isValidWord('CAT'); // true

// Get all words with a prefix
const words = getWordsWithPrefix('CA'); // ['CAT', 'CAR', 'CARE', ...]
```

### 5. Accessibility

- **ARIA roles**: Proper `role="grid"` and `role="gridcell"` attributes
- **Keyboard navigation**: Arrow keys, Enter, Escape, Backspace support
- **Screen reader friendly**: Descriptive labels and state announcements
- **44px minimum targets**: Mobile-friendly tap targets

### 6. Performance Optimizations

- **Web Worker**: Dictionary operations and pathfinding on separate thread
- **Debounced input**: Prevents excessive pathfinding during typing
- **Memoized context**: Stable references prevent unnecessary re-renders
- **Lazy loading**: Worker only spawned when needed for larger grids

## Usage Examples

### Basic Implementation

```tsx
import { GamePlayProvider } from '@/features/game-play/contexts/GamePlayContext';
import { WordGridDemo } from '@/features/game-play/components/WordGridDemo';

function App() {
  return (
    <GamePlayProvider>
      <WordGridDemo />
    </GamePlayProvider>
  );
}
```

### Custom Grid Size

```tsx
import { useGamePlay } from '@/features/game-play/contexts/GamePlayContext';

function CustomGrid() {
  const { state, actions } = useGamePlay();
  
  useEffect(() => {
    actions.setGridSize('medium'); // 6×6 grid
    actions.generateGrid();
  }, []);
  
  return <LetterGrid />;
}
```

### Word Validation

```tsx
import { useWordPath } from '@/features/game-play/hooks/useWordPath';

function WordValidator() {
  const { canFormWordOnGrid, findBestPathForWord } = useWordPath();
  
  const checkWord = (word: string) => {
    const canForm = canFormWordOnGrid(word);
    const path = findBestPathForWord(word);
    
    return { canForm, path };
  };
}
```

## Testing

The implementation includes comprehensive tests:

- **Unit tests**: Core algorithms (grid generation, pathfinding, dictionary)
- **Component tests**: React component behavior and user interactions
- **Integration tests**: End-to-end workflows and context integration
- **Accessibility tests**: ARIA attributes and keyboard navigation

Run tests with:
```bash
npm test                    # Unit and component tests
npm run test:integration    # Integration tests with emulators
npm run test:e2e           # End-to-end tests with Playwright
```

## Performance Metrics

Based on the spike requirements:

- **Input lag**: <100ms for 4×4, <200ms for 6×6 grids ✅
- **Dictionary size**: 100+ words with room for expansion ✅
- **Bundle impact**: <500KB additional for dictionary + worker ✅
- **Accessibility**: Full keyboard navigation and screen reader support ✅

## Future Enhancements

### Planned Features

1. **Larger dictionaries**: Load 50k+ word lists from external sources
2. **Cloud Function validation**: Server-side anti-cheat for competitive modes
3. **Grid persistence**: Save and replay generated grids
4. **Advanced pathfinding**: Optimize for very large grids (10×10+)
5. **Multi-language support**: Different dictionaries for different languages

### Performance Improvements

1. **Virtual scrolling**: For very large grids
2. **Path caching**: Cache common word paths
3. **Progressive loading**: Load dictionary chunks as needed
4. **WebAssembly**: Move pathfinding to WASM for maximum performance

## Configuration

### Environment Variables

```bash
# Use Web Workers (default: true)
NEXT_PUBLIC_USE_WORKERS=true

# Dictionary source URL (optional)
NEXT_PUBLIC_DICTIONARY_URL=/api/dictionary

# Grid generation strategy (boggle|frequency|random)
NEXT_PUBLIC_GRID_STRATEGY=boggle
```

### Customization

```typescript
// Custom grid generation options
const options = {
  strategy: 'boggle' as const,
  seedWords: ['CAT', 'DOG', 'LOVE'],
  minWordLength: 3
};

const grid = generateLetterGrid(6, options);
```

## Troubleshooting

### Common Issues

1. **Worker not loading**: Check browser support and build configuration
2. **Slow pathfinding**: Reduce grid size or disable diagonals
3. **Dictionary not found**: Ensure dictionary is initialized before use
4. **Accessibility issues**: Verify ARIA attributes and keyboard handlers

### Debug Mode

Enable debug logging:
```typescript
// In development
localStorage.setItem('word-grid-debug', 'true');
```

## Contributing

When adding new features:

1. Follow the existing architecture patterns
2. Add comprehensive tests
3. Update accessibility attributes
4. Consider performance implications
5. Update this documentation

## References

- [Word Grid Spike](./spikes/2025-09-04-word-grid-spike.md)
- [Boggle Letter Distribution](https://en.wikipedia.org/wiki/Boggle)
- [Trie Data Structure](https://en.wikipedia.org/wiki/Trie)
- [Web Workers Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [React Context Performance](https://kentcdodds.com/blog/how-to-use-react-context-effectively)


