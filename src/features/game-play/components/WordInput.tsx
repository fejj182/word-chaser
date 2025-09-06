'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWordSubmission } from '../hooks/useWordSubmission';
import { WordValidationResponse } from '../types/word';
import { useGamePlay } from '../contexts/GamePlayContext';
import { useWordPath } from '../hooks/useWordPath';

export const WordInput: React.FC = () => {
  const { state } = useGamePlay();
  const { 
    currentWord, 
    setCurrentWord, 
    findPathForTypedWord, 
    clearSelection,
    isValidPath
  } = useWordPath();
  
  const [submittedWords, setSubmittedWords] = useState<Array<{
    word: string;
    result: WordValidationResponse;
    timestamp: number;
  }>>([]);
  
  const { submitWord, isLoading, error, clearError } = useWordSubmission();

  // Debounced word input handler
  const [inputValue, setInputValue] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Update input value when currentWord changes from grid selection
  useEffect(() => {
    setInputValue(currentWord);
  }, [currentWord]);

  // Debounced handler for typing
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      setCurrentWord(value);
      if (value.length >= 3) {
        findPathForTypedWord(value);
      } else {
        clearSelection();
      }
    }, 150);
    
    setDebounceTimer(timer);
  }, [debounceTimer, setCurrentWord, findPathForTypedWord, clearSelection]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentWord.trim() && !isLoading && isValidPath) {
      try {
        const result = await submitWord(currentWord.trim(), state.grid);
        
        const newSubmission = {
          word: currentWord.trim().toUpperCase(),
          result,
          timestamp: Date.now()
        };
        
        setSubmittedWords(prev => [newSubmission, ...prev]);
        setCurrentWord('');
        setInputValue('');
        clearSelection();
        
      } catch (error) {
        // Error is handled by the hook
        console.error('Failed to submit word:', error);
      }
    }
  };

  const handleClear = () => {
    setCurrentWord('');
    setInputValue('');
    clearSelection();
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

  // Get validation status for current word
  const getValidationStatus = () => {
    if (!currentWord || currentWord.length < 3 || !isValidPath) {
      return { isValid: false };
    }
    
    return { isValid: true };
  };

  const validationStatus = getValidationStatus();

  return (
    <div className={`space-y-4`}>
      <h2 className="text-xl font-semibold text-gray-900">Submit Words</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3" role="form">
        <div>
          <label htmlFor="word-input" className="form-label">
            Current Word
          </label>
          <input
            id="word-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value.toUpperCase())}
            className={`form-input text-center text-lg font-mono ${
              currentWord.length >= 3 
                ? validationStatus.isValid 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
                : ''
            }`}
            placeholder="Type your word or click letters..."
            maxLength={20}
            aria-describedby="word-help word-validation"
            aria-invalid={currentWord.length >= 3 && !validationStatus.isValid}
            disabled={isLoading}
          />
          <p id="word-help" className="text-sm text-gray-600 mt-1">
            Use at least 3 letters. Type or click letters on the grid.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={!validationStatus.isValid || isLoading}
            className={`btn btn--primary btn--full ${!validationStatus.isValid ? 'btn--disabled' : ''}`}
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
