import { NextRequest, NextResponse } from 'next/server';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase/firebase';

const ROOMS_PATH = 'rooms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, action } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId and userId' },
        { status: 400 }
      );
    }

    const roomRef = ref(db, `${ROOMS_PATH}/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      return NextResponse.json({ success: true }); // Room doesn't exist, nothing to do
    }

    const room = roomSnapshot.val();
    const playerIndex = room.players.findIndex((p: any) => p.id === userId);
    
    if (playerIndex === -1) {
      return NextResponse.json({ success: true }); // Player not in room
    }

    const now = Date.now();
    const updates: Record<string, any> = {};

    if (action === 'leave') {
      // User is intentionally leaving - remove them immediately
      const updatedPlayers = room.players.filter((p: any) => p.id !== userId);
      updates[`${ROOMS_PATH}/${roomId}/players`] = updatedPlayers;
      
      // Transfer host if needed
      if (room.players[playerIndex]?.isHost && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;
        updates[`${ROOMS_PATH}/${roomId}/players`] = updatedPlayers;
      }
    } else {
      // Update last seen timestamp for grace period tracking
      updates[`${ROOMS_PATH}/${roomId}/players/${playerIndex}/lastSeen`] = now;
    }

    await update(ref(db), updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in heartbeat API:', error);
    return NextResponse.json({ success: true }); // Don't fail on heartbeat errors
  }
}
