'use client';

import React, { useState } from 'react';

export const WordInput: React.FC = () => {
  const [word, setWord] = useState('');
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim()) {
      setSubmittedWords(prev => [...prev, word.trim().toUpperCase()]);
      setWord('');
    }
  };

  const handleClear = () => {
    setWord('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text--section-title">Submit Words</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3" role="form">
        <div>
          <label htmlFor="word-input" className="form-label">
            Current Word
          </label>
          <input
            id="word-input"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="form-input text-center text-lg font-mono"
            placeholder="Type your word..."
            maxLength={20}
            aria-describedby="word-help"
          />
          <p id="word-help" className="text-sm text-gray-600 mt-1">
            Use at least 3 letters
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={word.trim().length < 3}
            className="btn btn--primary btn--full btn--disabled"
          >
            Submit Word
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn--secondary btn--small"
          >
            Clear
          </button>
        </div>
      </form>

      {submittedWords.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted Words</h3>
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            {submittedWords.map((submittedWord, index) => (
              <div key={index} className="text-sm font-mono text-gray-800">
                {submittedWord}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
