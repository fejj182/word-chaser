import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRoom } from '@/features/room-management/contexts/RoomContext';
import { useAuth } from '@/features/user-management/hooks/useAuth';
import { startRoundTimer, endCurrentRound, getRemainingTime, shouldRoundEnd } from '@/lib/firebase/round-utils';

export const useGameTimer = () => {
  const { currentRoom } = useRoom();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);

  const currentPlayer = useMemo(() => 
    user?.uid ? currentRoom?.players[user.uid] : undefined, 
    [user?.uid, currentRoom?.players]
  );
  
  const isHost = useMemo(() => 
    currentPlayer?.isHost || false, 
    [currentPlayer?.isHost]
  );

  // Update timer display based on room data
  useEffect(() => {
    if (!currentRoom?.gameData) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = getRemainingTime(currentRoom);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentRoom]);

  // Host starts timer when game begins
  const startRoundTimerHandler = useCallback(async (): Promise<void> => {
    if (!isHost || !currentRoom) {
      throw new Error('Only the host can start the timer');
    }

    await startRoundTimer(currentRoom.id);
  }, [isHost, currentRoom]);
  // Auto-check for round expiry every 5 seconds
  useEffect(() => {
    if (!currentRoom || !isHost) return;

    const roomId = currentRoom.id;
    const checkRoundExpiry = async (): Promise<void> => {
      if (!shouldRoundEnd(currentRoom)) {
        return;
      }

      // End the round directly - no API call needed
      try {
        await endCurrentRound(roomId);
      } catch (error) {
        console.error('Failed to end round:', error);
      }
    };

    const interval = setInterval(() => {
      checkRoundExpiry().catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentRoom, isHost]);

  return {
    timeLeft,
    isHost,
    startRoundTimer: startRoundTimerHandler,
    isTimerRunning: currentRoom?.gameData?.timerStatus === 'running',
    currentRound: currentRoom?.gameData?.currentRound || 1,
  };
};
