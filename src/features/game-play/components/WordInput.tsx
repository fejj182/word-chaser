'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWordSubmission } from '../hooks/useWordSubmission';
import { useGamePlay } from '../contexts/GamePlayContext';
import { useWordPath } from '../hooks/useWordPath';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { useSubmittedWords } from '../hooks/useSubmittedWords';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

export const WordInput: React.FC = () => {
  const { state } = useGamePlay();
  const { currentRoom } = useRoom();
  const { user } = useAuth();
  const { 
    currentWord, 
    setCurrentWord,
    selectTilesForWord, 
    clearSelection,
    isValidPath
  } = useWordPath();
  
  const { submittedWords, isWordSubmitted } = useSubmittedWords();
  const { submitWord, isLoading, error, clearError } = useWordSubmission();
  const { toast, showError, showSuccess, hideToast } = useToast();

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
      if (value.length >= 1) {
        selectTilesForWord(value);
      } else {
        clearSelection();
      }
    }, 150);
    
    setDebounceTimer(timer);
  }, [debounceTimer, setCurrentWord, selectTilesForWord, clearSelection]);

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
    if (currentWord.trim() && !isLoading && isValidPath && currentRoom && user) {
      try {
        const result = await submitWord(currentWord.trim(), state.grid, currentRoom.id, user.uid);
        
        if (result.result.isValid) {
          // Show success toast for valid words
          showSuccess(`"${currentWord.trim().toUpperCase()}" - ${result.result.score} points!`);
          
          // Clear the input on successful submission
          setCurrentWord('');
          setInputValue('');
          clearSelection();
        } else {
          // Show error toast for invalid words
          const reason = result.result.reason || 'Invalid word';
          showError(`"${currentWord.trim().toUpperCase()}" - ${reason}`);
        }
        
      } catch (error) {
        // Show error toast for submission failures
        showError(`"${currentWord.trim().toUpperCase()}" - Submission failed`);
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

  // Get validation status for current word (for submission)
  const getValidationStatus = () => {
    if (!currentWord || currentWord.length < 3 || !isValidPath) {
      return { isValid: false };
    }
    
    // Check if word has already been submitted
    if (isWordSubmitted(currentWord)) {
      return { isValid: false, reason: 'Word has already been submitted' };
    }
    
    return { isValid: true };
  };

  const validationStatus = getValidationStatus();

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div className={`space-y-4`}>
        <h2 className="text-xl font-semibold text-gray-900">Submit Words</h2>
      
      <form name="submit-words" onSubmit={handleSubmit} className="space-y-3" role="form">
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
              currentWord.length >= 1 
                ? currentWord.length >= 3
                  ? validationStatus.isValid 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50' // Show blue for valid path but not ready for submission
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
          {currentWord.length >= 3 && !validationStatus.isValid && validationStatus.reason && (
            <p id="word-validation" className="text-sm text-red-600 mt-1" role="alert">
              {validationStatus.reason}
            </p>
          )}
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
        <div className="form-error" role="alert" aria-live="assertive">
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
            {submittedWords.map((submission) => (
              <div 
                key={`${submission.word}-${submission.submittedAt}`} 
                className="p-3 rounded-lg border text-sm font-mono text-green-600 bg-green-50 border-green-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{submission.word}</span>
                  <span className="text-lg">✓</span>
                </div>
                <div className="text-xs mt-1">
                  <div>Score: {submission.score} points</div>
                  <div className="text-gray-500">by {submission.playerName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
};
