'use client';

import { useMemo } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';

export const useSubmittedWords = () => {
  const { currentRoom } = useRoom();

  const submittedWords = useMemo(() => {
    if (!currentRoom?.gameData?.submittedWords) {
      return [];
    }

    // Convert the record to an array and sort by submission time (newest first)
    return Object.values(currentRoom.gameData.submittedWords)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [currentRoom?.gameData?.submittedWords]);

  const isWordSubmitted = useMemo(() => {
    if (!currentRoom?.gameData?.submittedWords) {
      return () => false;
    }

    const submittedWordsSet = new Set(
      Object.keys(currentRoom.gameData.submittedWords).map(word => word.toUpperCase())
    );

    return (word: string) => submittedWordsSet.has(word.toUpperCase());
  }, [currentRoom?.gameData?.submittedWords]);

  return {
    submittedWords,
    isWordSubmitted
  };
};
