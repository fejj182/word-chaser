# Word Grid Spike: Interactive Letter Grid with Dictionary Validation

## Spike Objective
Design and implement an N×N interactive letter grid with two-way data binding to WordInput and real English dictionary validation for Word Chaser gameplay.

## Feature Requirements

### Core Functionality
- **Grid Sizes**: Small (4×4), Medium (6×6), Large (8×8) with toggleable selection
- **Two-way Binding**: 
  - Grid → Input: Clicking letters appends to WordInput
  - Input → Grid: Typing highlights valid path on grid (DFS adjacent, no tile reuse)
- **Dictionary Validation**: Real English dictionary validation with clear error states
- **Pathfinding**: DFS algorithm to find valid word paths on grid
- **UX**: Smooth interactions, minimal input lag, mobile-friendly tap targets

### Accessibility Requirements
- `role="grid"` with `role="gridcell"` for tiles
- `aria-selected` for selected tiles
- Keyboard navigation (arrows, enter, escape)
- `aria-invalid` and `aria-busy` for validation states
- 44px minimum tap targets

## Architecture Design

### Feature Structure
```
src/features/gameplay/
├── components/
│   ├── WordGrid.tsx          # Grid rendering, selection, a11y
│   └── WordInput.tsx         # Controlled input with validation
├── contexts/
│   └── GamePlayContext.tsx   # State: grid, selectedPath, currentWord
├── hooks/
│   └── useWordPath.ts        # DFS pathfinding logic
└── __tests__/                # Colocated unit/component tests
```

### State Management
- **GamePlayContext** as source of truth:
  - `grid: string[][]`
  - `gridSize: 'small'|'medium'|'large'`
  - `selectedPath: Array<{row:number; col:number}>`
  - `currentWord: string`
  - Actions: `setGridSize`, `generateGrid`, `selectTile`, `popSelection`, `setCurrentWord`, `validateWord`

### Performance Strategy
- **Debounced Input**: 100-200ms delay for typing → grid highlighting
- **Web Worker**: Offload dictionary lookup and DFS for 6×6+ grids
- **Memoization**: Stable context values, memoized derived state

## Dictionary Implementation Options

| Option | Execution | Dictionary Form | Pros | Cons | Recommendation |
|---|---|---|---|---|---|
| **Client TS + word list JSON** | Client main thread | Flat Set<string> | Simple, offline, fast O(1) | Large bundle, memory heavy | Prototypes only |
| **Client TS + compressed Trie** | Client (worker) | Trie (JSON/serialize) | Smaller than flat, prefix lookups | Build pipeline needed | Good balance |
| **Client TS + DAWG** | Client (worker) | Directed acyclic word graph | Very compact, fast lookup | Complexity, fewer libs | Large dicts |
| **Bloom filter precheck** | Client (worker) | Bloom + fallback | Tiny memory, fast negatives | False positives | Reduce API calls |
| **Web Worker + Trie/DAWG** | Client worker thread | Trie/DAWG | Smooth UI, scalable | Worker infra overhead | **Recommended** |
| **Firebase Cloud Function** | Server | Trie/DAWG in RAM | Single source, anti-cheat | Network latency, cost | Competitive modes |
| **Hybrid: Client + CF verify** | Both | Bloom/Trie + CF | Snappy UX + authoritative | Double complexity | Ranked/leaderboards |
| **External API** | Serverless | HTTP lookups | Zero maintenance | Rate limits, latency | Non-critical only |

**Decision**: Web Worker with compressed Trie for primary validation; optional CF verify for competitive modes.

## Grid Generation Options

| Strategy | Description | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Uniform random** | Each cell random A–Z | Simple | Often unsolvable | No |
| **Frequency-weighted** | Weight by English frequency | Better word yield | Still random pockets | Good baseline |
| **Boggle-style dice** | Predefined dice distributions | Balanced consonant/vowel | Custom data needed | **Recommended** |
| **Seeded with words** | Place 2-3 seed words, fill rest | Ensures solvable grids | Complex placement | Best for quality |

**Decision**: Boggle-style distributions with optional seeding for 6×6+ grids.

## Implementation Plan

### Phase 1: Foundation (1-2 days)
- [ ] Create gameplay feature skeleton (components, context, hook)
- [ ] Implement grid generator with frequency/boggle presets
- [ ] Basic DFS pathfinding with adjacency rules
- [ ] Unit tests for core algorithms

### Phase 2: Dictionary Integration (1-2 days)
- [ ] Dictionary adapter interface (`src/lib/dictionary.ts`)
- [ ] Web Worker for dictionary lookups and pathfinding
- [ ] Trie/DAWG implementation or library integration
- [ ] Performance testing on large grids

### Phase 3: Two-way Binding (1 day)
- [ ] Grid click → WordInput append
- [ ] WordInput typing → grid path highlighting
- [ ] Backspace → pop selection and unhighlight
- [ ] Debounced input handling

### Phase 4: UX Polish (1 day)
- [ ] Accessibility attributes and keyboard navigation
- [ ] Visual feedback (highlighting, validation states)
- [ ] Mobile-friendly tap targets
- [ ] Error states and loading indicators

### Phase 5: Testing (1 day)
- [ ] Unit tests: grid generation, pathfinding, dictionary
- [ ] Component tests: two-way binding, user interactions
- [ ] Integration tests: 6×6 with large dictionary
- [ ] E2E tests: complete word selection flow

## Technical Decisions

### Dictionary Backend
- **Primary**: Web Worker with compressed Trie
- **Fallback**: Client-side Set for offline mode
- **Future**: Firebase Cloud Function for anti-cheat

### Grid Generation
- **Default**: Boggle-style letter distributions
- **Advanced**: Optional seeded word placement
- **Configurable**: Letter frequency weights

### Pathfinding Algorithm
- **DFS with backtracking**: Find all valid paths
- **Adjacency**: 8-directional (including diagonals)
- **Constraints**: No tile reuse, minimum word length
- **Optimization**: Early termination for invalid prefixes

### Performance Optimizations
- **Lazy Worker**: Only spawn for 6×6+ grids
- **Debounced Input**: 150ms delay for typing
- **Memoized Context**: Stable references to prevent re-renders
- **Virtual Scrolling**: For very large grids (future)

## Testing Strategy

### Unit Tests
- `generateLetterGrid()` with different strategies
- `useWordPath` DFS algorithm edge cases
- Dictionary adapter with mock data
- Grid size validation and constraints

### Component Tests
- Grid click builds `currentWord` correctly
- Backspace pops selection and unhighlights
- Typing highlights valid path
- Invalid input clears path and shows error

### Integration Tests
- 6×6 grid with large dictionary runs responsive
- Web Worker communication and error handling
- Context state updates across components

### E2E Tests
- Complete word selection flow: click path → submit word
- Type word → path highlights → submit
- Grid size switching maintains state
- Mobile touch interactions

## File Structure

```
src/features/gameplay/
├── components/
│   ├── WordGrid.tsx                    # Grid rendering, selection, a11y
│   ├── WordInput.tsx                   # Controlled input with validation
│   └── GridSizeSelector.tsx            # Size toggle component
├── contexts/
│   └── GamePlayContext.tsx             # State management
├── hooks/
│   ├── useWordPath.ts                  # DFS pathfinding
│   ├── useGridGeneration.ts            # Grid creation logic
│   └── useDictionaryValidation.ts      # Dictionary integration
├── types/
│   └── gameplay.ts                     # TypeScript interfaces
└── __tests__/
    ├── components/
    ├── hooks/
    └── contexts/

src/lib/
├── dictionary.ts                       # Dictionary adapter interface
├── workers/
│   └── dictionary.worker.ts            # Web Worker for heavy lifting
└── utils/
    ├── grid-generation.ts              # Grid creation algorithms
    └── pathfinding.ts                  # DFS implementation
```

## Open Questions

### Gameplay Rules
- **Diagonal adjacency**: Allow diagonal connections? (Recommended: Yes)
- **Minimum word length**: 3, 4, or 5 letters? (Recommended: 3)
- **Dictionary variant**: American vs British English? (Recommended: American)
- **Proper nouns**: Allow names, places? (Recommended: No)

### Technical Decisions
- **Anti-cheat**: Server-side validation needed now or later? (Recommended: Later)
- **Offline support**: Full offline dictionary or network required? (Recommended: Full offline)
- **Grid persistence**: Save generated grids for replay? (Recommended: No, keep random)

### Performance Targets
- **Input lag**: <100ms for 4×4, <200ms for 6×6, <500ms for 8×8
- **Dictionary size**: Target 50k-100k words for good coverage
- **Bundle impact**: <500KB additional for dictionary + worker

## Risks and Mitigation

### Technical Risks
- **Web Worker complexity**: Adds messaging overhead and debugging complexity
  - *Mitigation*: Start with main thread, move to worker only when needed
- **Dictionary size**: Large word lists impact bundle size and memory
  - *Mitigation*: Use compressed formats, lazy loading, CDN hosting
- **Pathfinding performance**: DFS can be slow on large grids with complex words
  - *Mitigation*: Early termination, prefix pruning, worker offloading

### UX Risks
- **Input lag**: Slow dictionary lookups make typing feel sluggish
  - *Mitigation*: Debouncing, optimistic UI updates, background validation
- **Mobile usability**: Small tap targets, complex gestures
  - *Mitigation*: 44px minimum targets, simple tap-to-select, clear visual feedback

### Product Risks
- **Dictionary accuracy**: Wrong validation frustrates users
  - *Mitigation*: Use established word lists, allow user feedback, regular updates
- **Grid quality**: Random grids often have no valid words
  - *Mitigation*: Boggle-style generation, optional seeding, quality metrics

## Success Criteria

### Functional
- [ ] 4×4, 6×6, 8×8 grid generation with toggle
- [ ] Two-way binding: grid clicks ↔ WordInput
- [ ] Real dictionary validation with error states
- [ ] DFS pathfinding with adjacency rules
- [ ] Backspace removes last selection

### Performance
- [ ] <100ms input lag for 4×4 grids
- [ ] <200ms input lag for 6×6 grids
- [ ] <500ms input lag for 8×8 grids
- [ ] Web Worker keeps UI responsive on large grids

### Accessibility
- [ ] Full keyboard navigation
- [ ] Screen reader compatibility
- [ ] 44px minimum tap targets
- [ ] Clear visual feedback for all states

### Quality
- [ ] 90%+ test coverage for core algorithms
- [ ] E2E tests for complete user flows
- [ ] Mobile-friendly on iOS/Android
- [ ] Works offline with cached dictionary

## Next Steps

1. **Approve architecture**: Review feature structure and technical decisions
2. **Implement Phase 1**: Create foundation with basic grid generation
3. **Dictionary research**: Evaluate Trie/DAWG libraries and word lists
4. **Prototype pathfinding**: Build DFS algorithm with test cases
5. **Iterate on UX**: Test two-way binding and mobile interactions

## References

- [Boggle Letter Distribution](https://en.wikipedia.org/wiki/Boggle)
- [Trie Data Structure](https://en.wikipedia.org/wiki/Trie)
- [DAWG Implementation](https://en.wikipedia.org/wiki/Deterministic_acyclic_finite_state_automaton)
- [Web Workers Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [React Context Performance](https://kentcdodds.com/blog/how-to-use-react-context-effectively)

---

*Spike completed: [Date]*
*Decision: Proceed with Web Worker + Trie dictionary and Boggle-style grid generation*
