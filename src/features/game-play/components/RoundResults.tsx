'use client';

import React, { useState, useEffect } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { RoundResult } from '@/features/room-management/types/room';
import { RoundResultsUI } from './RoundResults/RoundResultsUI';

export const RoundResults: React.FC = () => {
  const { currentRoom } = useRoom();
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [countdown, setCountdown] = useState(5);

  const currentRound = currentRoom?.gameData?.currentRound;
  const roundResults = currentRoom?.gameData?.roundResults;
  const timerStatus = currentRoom?.gameData?.timerStatus;
  const maxRounds = currentRoom?.settings?.maxRounds;

  useEffect(() => {
    if (currentRound && roundResults?.[`round-${currentRound}`] && timerStatus === 'ended' && currentRound < (maxRounds || 0)) {
      setRoundResult(roundResults?.[`round-${currentRound}`]);
      setCountdown(5);
    } else {
      setRoundResult(null);
    }
  }, [roundResults, currentRound, timerStatus, maxRounds]);

  useEffect(() => {
    if (!roundResult) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundResult]);

  if (!currentRoom || !roundResult) {
    return null;
  }

  return (
    <RoundResultsUI
      roundResult={roundResult}
      players={currentRoom.players}
      countdown={countdown}
    />
  );
};
