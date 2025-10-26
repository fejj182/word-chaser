# Dictionary Upgrade MVP Spike

**Date:** 2025-09-17  
**Author:** AI Assistant  
**Status:** Draft  
**Priority:** MVP - Fast Implementation

## Problem Statement

Current `DEFAULT_WORDS` has only ~95 words, causing frequent "word not found" frustration. Need a quick solution to validate the product with users.

## MVP Requirements

- **Time to implement:** < 1 day
- **Effort:** Minimal code changes
- **Goal:** 1,000+ words to reduce user frustration
- **Quality:** "Good enough" for MVP validation

## Recommended Solution: Single Static Word List

### Why This Approach
- ✅ **Fastest implementation** (2-3 hours)
- ✅ **Zero complexity** - just replace the array
- ✅ **No new dependencies**
- ✅ **No breaking changes**
- ✅ **Immediate improvement**

### Implementation Plan

#### Step 1: Find a Good Word List (30 minutes)
**Source:** [SCOWL English Word Lists](http://wordlist.aspell.net/scowl-readme/)
- Download `english-words.10` (10,000 most common words)
- Filter to 3-8 letter words (game-appropriate)
- Remove proper nouns, abbreviations, etc.

#### Step 2: Process the List (30 minutes)
```bash
# Download and filter
curl -o words.txt http://wordlist.aspell.net/dicts/english-words.10
grep -E '^[a-z]{3,8}$' words.txt > filtered-words.txt
```

#### Step 3: Replace DEFAULT_WORDS (15 minutes)
```typescript
// src/lib/dictionary.ts
const DEFAULT_WORDS = [
  // Import from generated file
  ...require('./word-lists/common-words.json')
];
```

#### Step 4: Test (30 minutes)
- Run existing tests
- Add a few integration tests
- Verify performance is still good

### Alternative: Use Existing NPM Package

**Even faster option (15 minutes total):**

```bash
npm install word-list
```

```typescript
// src/lib/dictionary.ts
import wordList from 'word-list';

const DEFAULT_WORDS = wordList
  .split('\n')
  .filter(word => word.length >= 3 && word.length <= 8)
  .slice(0, 2000); // Take first 2000 for reasonable size
```

**Pros:**
- ✅ **15 minutes total**
- ✅ **No file processing**
- ✅ **Well-maintained package**

**Cons:**
- ❌ **Adds dependency**
- ❌ **Less control over word selection**

### Recommended: Hybrid Approach

**Best of both worlds (1 hour total):**

1. **Use NPM package for MVP** (15 minutes)
2. **Create simple word list file** (30 minutes)
3. **Switch to static file** (15 minutes)

```typescript
// src/lib/word-lists/common-words.ts
export const COMMON_WORDS = [
  'cat', 'dog', 'run', 'sun', 'fun', 'big', 'red', 'blue',
  'love', 'hope', 'life', 'time', 'work', 'play', 'game',
  'happy', 'peace', 'dream', 'light', 'night', 'music',
  // ... 2000+ more words
];
```

## Implementation Details

### File Structure
```
src/lib/
├── dictionary.ts (modified)
├── word-lists/
│   ├── common-words.ts
│   └── index.ts
```

### Code Changes

#### 1. Create word list file
```typescript
// src/lib/word-lists/common-words.ts
export const COMMON_WORDS = [
  // Generated list of ~2000 words
] as const;
```

#### 2. Update dictionary.ts
```typescript
// src/lib/dictionary.ts
import { COMMON_WORDS } from './word-lists/common-words';

// Replace the existing DEFAULT_WORDS array
const DEFAULT_WORDS = [...COMMON_WORDS];
```

#### 3. Add simple tests
```typescript
// src/lib/__tests__/dictionary-mvp.test.ts
describe('Dictionary MVP', () => {
  it('should have significantly more words', () => {
    // This will fail initially, then pass after upgrade
    expect(DEFAULT_WORDS.length).toBeGreaterThan(1000);
  });

  it('should validate common words', () => {
    expect(isValidWord('the')).toBe(true);
    expect(isValidWord('and')).toBe(true);
    expect(isValidWord('for')).toBe(true);
  });
});
```

## Word List Sources (Quick Options)

### Option 1: SCOWL (Recommended)
- **URL:** http://wordlist.aspell.net/scowl-readme/
- **Size:** 10,000+ words
- **Quality:** High (used by spell checkers)
- **Format:** Plain text, easy to process

### Option 2: Google Books Ngram
- **URL:** https://storage.googleapis.com/books/ngrams/books/datasetsv3.html
- **Size:** Millions of words
- **Quality:** Very high
- **Format:** Requires more processing

### Option 3: Word Game Lists
- **Scrabble:** Official tournament word list
- **Wordle:** Curated 5-letter words
- **Boggle:** Game-specific vocabulary

## Quick Implementation Script

```bash
#!/bin/bash
# quick-dictionary-upgrade.sh

echo "Downloading word list..."
curl -s http://wordlist.aspell.net/dicts/english-words.10 > words.txt

echo "Filtering words..."
grep -E '^[a-z]{3,8}$' words.txt | head -2000 > filtered-words.txt

echo "Converting to TypeScript..."
echo "export const COMMON_WORDS = [" > src/lib/word-lists/common-words.ts
sed "s/^/  '/; s/$/',/" filtered-words.txt >> src/lib/word-lists/common-words.ts
echo "] as const;" >> src/lib/word-lists/common-words.ts

echo "Cleaning up..."
rm words.txt filtered-words.txt

echo "Done! Run tests to verify."
```

## Testing Strategy (Minimal)

### Unit Tests
```typescript
describe('Dictionary MVP', () => {
  it('should have more words than before', () => {
    expect(DEFAULT_WORDS.length).toBeGreaterThan(500);
  });

  it('should validate basic English words', () => {
    const basicWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'];
    basicWords.forEach(word => {
      expect(isValidWord(word)).toBe(true);
    });
  });

  it('should still reject non-words', () => {
    expect(isValidWord('xyz')).toBe(false);
    expect(isValidWord('qqq')).toBe(false);
  });
});
```

### Performance Check
```typescript
it('should still be fast', () => {
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    isValidWord('example');
  }
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(10); // Should be very fast
});
```

## Success Criteria

### Quantitative
- **Word count:** >1,000 words (vs. current ~95)
- **Implementation time:** <2 hours
- **Bundle size increase:** <100KB
- **Performance:** No noticeable slowdown

### Qualitative
- **User feedback:** Fewer "word not found" complaints
- **Gameplay:** More engaging word discovery
- **Stability:** No regressions in existing functionality

## Risk Mitigation

### Low Risk Changes
- ✅ **No API changes**
- ✅ **No breaking changes**
- ✅ **Existing tests should pass**
- ✅ **Easy to rollback**

### Monitoring
- Watch bundle size in build
- Monitor test performance
- Check for any new linting errors

## Future Considerations

After MVP validation, consider:
1. **User feedback analysis** - which words are still missing?
2. **Performance optimization** - if bundle size becomes an issue
3. **Advanced features** - difficulty levels, categories, etc.

## Conclusion

For MVP, the single static word list approach provides:
- **Fastest implementation** (1-2 hours)
- **Immediate improvement** (10x more words)
- **Zero complexity** (just replace an array)
- **Easy rollback** (if needed)

**Next Steps:**
1. Download word list (30 min)
2. Process and format (30 min)  
3. Update code (15 min)
4. Test (30 min)
5. Deploy and validate with users

**Total time investment:** ~2 hours for significant user experience improvement.
