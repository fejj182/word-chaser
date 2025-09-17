import { useState, useCallback } from 'react';
import { WordValidationRequest, WordValidationResponse } from '../types/word';

interface WordSubmissionState {
  isLoading: boolean;
  error: string | null;
}

export const useWordSubmission = () => {
  const [state, setState] = useState<WordSubmissionState>({
    isLoading: false,
    error: null
  });

  const submitWord = useCallback(async (
    word: string,
    boardLetters: string[][],
    roomId: string,
    userId: string
  ): Promise<WordValidationResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: WordValidationRequest = {
        word: word.trim(),
        boardLetters,
        roomId,
        userId
      };

      const response = await fetch('/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: WordValidationResponse = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSubmission: result
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit word';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    submitWord,
    clearError
  };
};

