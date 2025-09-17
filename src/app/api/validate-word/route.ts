import { NextRequest, NextResponse } from 'next/server';
import { validateWordSubmission } from '@/lib/word-validation';
import { updatePlayerScoreAdmin } from '@/lib/firebase/admin-room-utils';
import { WordValidationRequest, WordValidationResponse } from '@/features/game-play/types/word';

export async function POST(request: NextRequest) {
  try {
    const body: WordValidationRequest = await request.json();
    const { word, boardLetters, roomId, userId } = body;

    // Validate required fields
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

    // Validate word on board
    const validation = validateWordSubmission(word, boardLetters, {
      allowReuse: false,
      minLength: 3
    });

    // If word is valid, update player score in database
    if (validation.isValid) {
      try {
        await updatePlayerScoreAdmin(roomId, userId, validation.score);
      } catch (error) {
        console.error('Failed to update player score:', error);
        // Continue with response even if score update fails
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
