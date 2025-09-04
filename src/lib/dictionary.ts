//TODO: use a more comprehensive dictionary
export const DICTIONARY = new Set([
  'abc', 'aei', 'afk', // connected
  'bac', 'fak', 'afp', // not connected
  'abcd', 'abcdh', 'abcdhg', 'abcdhgf', // longer words with bonus
  'zed', // not on board
]);

export const isValidWord = (word: string): boolean => {
  const cleanWord = word.toLowerCase().trim();
  return cleanWord.length >= 3 && DICTIONARY.has(cleanWord);
};

//TODO: move to own file
export const calculateWordScore = (word: string): number => {
  const cleanWord = word.toLowerCase().trim();
  if (!isValidWord(cleanWord)) return 0;
  
  const baseScore = cleanWord.length * 10;
  
  // Bonus for longer words
  if (cleanWord.length >= 6) return baseScore + 50;
  if (cleanWord.length >= 5) return baseScore + 25;
  
  return baseScore;
};
