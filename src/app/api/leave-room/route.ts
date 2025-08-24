import { NextRequest, NextResponse } from 'next/server';
import { leaveRoom } from '@/lib/firebase/room-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId and userId' },
        { status: 400 }
      );
    }

    await leaveRoom(roomId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in leave-room API:', error);
    
    // Return success even on error to avoid retries
    // The cleanup is best-effort and shouldn't block the page unload
    return NextResponse.json({ success: true });
  }
}
