import { NextRequest, NextResponse } from 'next/server';
import { validateWordSubmission } from '@/lib/word-validation';
import { updatePlayerScoreAdmin, addSubmittedWordAdmin as addSubmittedWordToGlobalListAdmin, isWordAlreadySubmittedAdmin } from '@/lib/firebase/admin-room-utils';
import { WordValidationRequest, WordValidationResponse } from '@/features/game-play/types/word';

export async function POST(request: NextRequest) {
  try {
    const body: WordValidationRequest = await request.json();
    const { word, boardLetters, roomId, userId } = body;

    if (!word || !boardLetters || !roomId || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          result: { isValid: false, score: 0 },
          error: 'Missing required fields' 
        } as WordValidationResponse,
        { status: 400 }
      );
    }

    const isAlreadySubmitted = await isWordAlreadySubmittedAdmin(roomId, word);
    if (isAlreadySubmitted) {
      return NextResponse.json(
        { 
          success: false, 
          result: { isValid: false, score: 0, reason: 'Word has already been submitted' },
          error: 'Word has already been submitted' 
        } as WordValidationResponse,
        { status: 400 }
      );
    }

    // Validate word on board
    const validation = validateWordSubmission(word, boardLetters, {
      allowReuse: false,
      minLength: 3
    });

    if (validation.isValid) {
      try {
        const playerName = await getPlayerName(roomId, userId);
        await addSubmittedWordToGlobalListAdmin(roomId, word, userId, playerName, validation.score);
        await updatePlayerScoreAdmin(roomId, userId, validation.score);
      } catch (error) {
        console.error('Failed to update player score or add submitted word:', error);
        // Continue with response even if database update fails
      }
    }

    const response: WordValidationResponse = {
      success: true,
      result: {
        isValid: validation.isValid,
        score: validation.score,
        reason: validation.reason,
        path: validation.path
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in validate-word API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        result: { isValid: false, score: 0 },
        error: 'Internal server error' 
      } as WordValidationResponse,
      { status: 500 }
    );
  }
}
async function getPlayerName(roomId: string, userId: string) {
  const { getRoom } = await import('@/lib/firebase/admin-room-utils');
  const room = await getRoom(roomId);
  return room?.players[userId]?.displayName || 'Unknown Player';
}

