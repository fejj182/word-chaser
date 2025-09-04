'use client';

import React, { useState } from 'react';
import { useWordSubmission } from '../hooks/useWordSubmission';
import { WordValidationResponse } from '../types/word';

export interface WordInputProps {
  boardLetters: string[][];
  onWordSubmitted?: (result: WordValidationResponse) => void;
}

export const WordInput: React.FC<WordInputProps> = ({ 
  boardLetters,
  onWordSubmitted 
}) => {
  const [word, setWord] = useState('');
  const [submittedWords, setSubmittedWords] = useState<Array<{
    word: string;
    result: WordValidationResponse;
    timestamp: number;
  }>>([]);
  
  const { submitWord, isLoading, error, clearError } = useWordSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() && !isLoading) {
      try {
        const result = await submitWord(word.trim(), boardLetters);
        
        const newSubmission = {
          word: word.trim().toUpperCase(),
          result,
          timestamp: Date.now()
        };
        
        setSubmittedWords(prev => [newSubmission, ...prev]);
        setWord('');
        
        if (onWordSubmitted) {
          onWordSubmitted(result);
        }
      } catch (error) {
        // Error is handled by the hook
        console.error('Failed to submit word:', error);
      }
    }
  };

  const handleClear = () => {
    setWord('');
    clearError();
  };

  const getWordStatusClass = (result: WordValidationResponse) => {
    if (result.result.isValid) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getWordStatusIcon = (result: WordValidationResponse) => {
    if (result.result.isValid) {
      return '✓';
    }
    return '✗';
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
            disabled={isLoading}
          />
          <p id="word-help" className="text-sm text-gray-600 mt-1">
            Use at least 3 letters
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={word.trim().length < 3 || isLoading}
            className="btn btn--primary btn--full btn--disabled"
            aria-busy={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Word'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn--secondary btn--small"
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="form-error">
          <button
            type="button"
            onClick={clearError}
            className="float-right text-sm underline"
            aria-label="Clear error"
          >
            Dismiss
          </button>
          {error}
        </div>
      )}

      {submittedWords.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted Words</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {submittedWords.map((submission, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border text-sm font-mono ${getWordStatusClass(submission.result)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{submission.word}</span>
                  <span className="text-lg">{getWordStatusIcon(submission.result)}</span>
                </div>
                {submission.result.result.isValid ? (
                  <div className="text-xs mt-1">
                    Score: {submission.result.result.score} points
                  </div>
                ) : (
                  <div className="text-xs mt-1">
                    {submission.result.result.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
