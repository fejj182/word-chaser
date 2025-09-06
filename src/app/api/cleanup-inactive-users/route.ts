import { NextRequest, NextResponse } from 'next/server';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase/firebase';

const ROOMS_PATH = 'rooms';
const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds grace period

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // For now, we'll make it manually callable for testing
    
    const roomsRef = ref(db, ROOMS_PATH);
    const roomsSnapshot = await get(roomsRef);
    
    if (!roomsSnapshot.exists()) {
      return NextResponse.json({ success: true, cleaned: 0 });
    }

    const rooms = roomsSnapshot.val();
    const now = Date.now();
    let totalCleaned = 0;
    const updates: Record<string, any> = {};

    for (const [roomId, room] of Object.entries(rooms as Record<string, any>)) {
      if (!room.players || !Array.isArray(room.players)) continue;

      const activePlayers = room.players.filter((player: any) => {
        // If no lastSeen timestamp, assume they're active (newer players)
        if (!player.lastSeen) return true;
        
        // Check if player is within grace period
        const timeSinceLastSeen = now - player.lastSeen;
        return timeSinceLastSeen < GRACE_PERIOD_MS;
      });

      // If we removed any players, update the room
      if (activePlayers.length !== room.players.length) {
        const removedCount = room.players.length - activePlayers.length;
        totalCleaned += removedCount;
        
        // Transfer host if the host was removed
        if (activePlayers.length > 0) {
          const hadHost = room.players.some((p: any) => p.isHost);
          const hasHost = activePlayers.some((p: any) => p.isHost);
          
          if (hadHost && !hasHost) {
            activePlayers[0].isHost = true;
          }
        }

        updates[`${ROOMS_PATH}/${roomId}/players`] = activePlayers;
        
        console.log(`Cleaned ${removedCount} inactive players from room ${roomId}`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }

    return NextResponse.json({ 
      success: true, 
      cleaned: totalCleaned,
      gracePeriodMs: GRACE_PERIOD_MS
    });
  } catch (error) {
    console.error('Error in cleanup-inactive-users API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup inactive users' },
      { status: 500 }
    );
  }
}
