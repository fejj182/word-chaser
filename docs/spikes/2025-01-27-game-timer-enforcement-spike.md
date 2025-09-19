# Game Timer Enforcement Spike: Functional Round Management

## Spike Objective
Design and implement a functional game timer system that enforces round time limits, manages round transitions, and announces winners when games conclude.

## Current State Analysis

### Existing Timer Implementation
- **Local-only timer**: `GameTimer` component uses local state with hardcoded 180-second countdown
- **No enforcement**: Timer reaches zero but doesn't trigger any game actions
- **No synchronization**: Each client runs independent timers
- **No round management**: No logic for starting/ending rounds or transitioning between them

### Existing Game Structure
- **Room settings**: `roundDuration` and `maxRounds` configured but unused
- **Game states**: `waiting` → `playing` → `finished` (no transition logic to `finished`)
- **Round tracking**: `currentRound` in `gameData` but no progression logic
- **Score tracking**: Player scores and words found are tracked in real-time

### Missing Components
- Server-side timer enforcement
- Round transition logic
- Game completion detection
- Winner announcement system
- Round results display

## Option 1: Server-Side Timer with Firebase Functions

### Architecture
- **Firebase Cloud Functions**: Server-side timer management using scheduled functions
- **Database triggers**: Timer state stored in Firebase RTDB
- **Client synchronization**: Clients subscribe to timer state changes
- **Automatic enforcement**: Server handles all timer logic and game state transitions

### Implementation Details

#### Database Schema Extensions
```typescript
// Add to Room.gameData
interface GameData {
  grid: string[][];
  currentRound: number;
  submittedWords: Record<string, SubmittedWord>;
  // New timer fields
  roundStartTime: number; // Timestamp when current round started
  roundEndTime: number;   // Calculated end time for current round
  timerStatus: 'running' | 'paused' | 'ended';
  roundResults?: RoundResult[];
  gameWinner?: {
    playerId: string;
    playerName: string;
    finalScore: number;
  };
}

interface RoundResult {
  roundNumber: number;
  roundScores: Record<string, number>; // Player scores for this round
  roundWords: Record<string, SubmittedWord[]>; // Words found this round
  roundWinner?: {
    playerId: string;
    playerName: string;
    score: number;
  };
}
```

#### Firebase Cloud Function
```typescript
// functions/src/game-timer.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onValueUpdated } from 'firebase-functions/v2/database';

// Check for expired rounds every 10 seconds
export const checkRoundExpiry = onSchedule('*/10 * * * * *', async (event) => {
  const roomsRef = admin.database().ref('rooms');
  const roomsSnapshot = await roomsRef.once('value');
  
  const now = Date.now();
  const expiredRooms: string[] = [];
  
  roomsSnapshot.forEach((roomSnapshot) => {
    const room = roomSnapshot.val();
    if (room.status === 'playing' && 
        room.gameData?.roundEndTime && 
        now >= room.gameData.roundEndTime) {
      expiredRooms.push(roomSnapshot.key);
    }
  });
  
  // Process expired rooms
  for (const roomId of expiredRooms) {
    await endCurrentRound(roomId);
  }
});

async function endCurrentRound(roomId: string): Promise<void> {
  const roomRef = admin.database().ref(`rooms/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  const room = roomSnapshot.val();
  
  if (!room || room.status !== 'playing') return;
  
  const currentRound = room.gameData.currentRound;
  const maxRounds = room.settings.maxRounds;
  
  // Calculate round results
  const roundResults = calculateRoundResults(room);
  
  // Check if game should end
  if (currentRound >= maxRounds) {
    await endGame(roomId, roundResults);
  } else {
    await startNextRound(roomId, roundResults);
  }
}
```

#### Client-Side Timer Component
```typescript
// Enhanced GameTimer component
export const GameTimer: React.FC = () => {
  const { currentRoom } = useRoom();
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    if (!currentRoom?.gameData) return;
    
    const { roundStartTime, roundEndTime, timerStatus } = currentRoom.gameData;
    
    if (timerStatus !== 'running') {
      setTimeLeft(0);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      setTimeLeft(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [currentRoom?.gameData]);
  
  // Rest of component...
};
```

### Pros
- **Bulletproof enforcement**: Server-side timer cannot be manipulated by clients
- **Automatic synchronization**: All clients see consistent timer state
- **Scalable**: Works with any number of players
- **Reliable**: Firebase Functions handle network issues and client disconnections

### Cons
- **Complexity**: Requires Firebase Functions setup and deployment
- **Cost**: Cloud Functions have usage costs
- **Latency**: 10-second check interval means up to 10-second delay in round ending
- **Dependencies**: Adds Firebase Functions dependency to the stack

## Option 2: Client-Side Timer with Server Validation (Reactive)

### Architecture
- **Host-managed timer**: Room host manages the authoritative timer
- **Reactive server validation**: API endpoints validate timer actions only when requested
- **Client synchronization**: Non-host clients sync with host timer via Firebase RTDB
- **On-demand validation**: Server validates timer state when host requests round ending

### Implementation Details

#### Timer Management Hook
```typescript
// useGameTimer hook
export const useGameTimer = () => {
  const { currentRoom } = useRoom();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isHost, setIsHost] = useState(false);
  
  const currentPlayer = user?.uid ? currentRoom?.players[user.uid] : undefined;
  const isRoomHost = currentPlayer?.isHost || false;
  
  useEffect(() => {
    setIsHost(isRoomHost);
  }, [isRoomHost]);
  
  // Host starts timer when game begins
  const startRoundTimer = useCallback(async () => {
    if (!isHost || !currentRoom) return;
    
    const roundDuration = currentRoom.settings.roundDuration * 1000; // Convert to ms
    const roundStartTime = Date.now();
    const roundEndTime = roundStartTime + roundDuration;
    
    await updateRoomGameData(currentRoom.id, {
      roundStartTime,
      roundEndTime,
      timerStatus: 'running'
    });
  }, [isHost, currentRoom]);
  
  // Host ends round early (optional feature)
  const endRoundEarly = useCallback(async () => {
    if (!isHost || !currentRoom) return;
    
    await endCurrentRound(currentRoom.id);
  }, [isHost, currentRoom]);
  
  return {
    timeLeft,
    isHost,
    startRoundTimer,
    endRoundEarly
  };
};
```

#### API Endpoints
```typescript
// src/app/api/end-round/route.ts
export async function POST(request: NextRequest) {
  const { roomId } = await request.json();
  
  // Validate request
  const room = await getRoom(roomId);
  if (!room || room.status !== 'playing') {
    return NextResponse.json({ error: 'Invalid room state' }, { status: 400 });
  }
  
  // Check if current round should end
  const now = Date.now();
  const shouldEnd = room.gameData?.roundEndTime && now >= room.gameData.roundEndTime;
  
  if (!shouldEnd) {
    return NextResponse.json({ error: 'Round not ready to end' }, { status: 400 });
  }
  
  await endCurrentRound(roomId);
  return NextResponse.json({ success: true });
}
```

#### Round Management Functions
```typescript
// src/lib/firebase/round-utils.ts
export const endCurrentRound = async (roomId: string): Promise<void> => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);
  const room = roomSnapshot.val();
  
  if (!room || room.status !== 'playing') return;
  
  const currentRound = room.gameData.currentRound;
  const maxRounds = room.settings.maxRounds;
  
  // Calculate round results
  const roundResults = calculateRoundResults(room);
  
  // Update room with round results
  const updates: Record<string, any> = {};
  updates[`rooms/${roomId}/gameData/roundResults/${currentRound}`] = roundResults;
  updates[`rooms/${roomId}/gameData/timerStatus`] = 'ended';
  
  // Check if game should end
  if (currentRound >= maxRounds) {
    const gameWinner = determineGameWinner(room.players, room.gameData.roundResults);
    updates[`rooms/${roomId}/status`] = 'finished';
    updates[`rooms/${roomId}/gameData/gameWinner`] = gameWinner;
  } else {
    // Start next round
    const nextRound = currentRound + 1;
    const roundDuration = room.settings.roundDuration * 1000;
    const roundStartTime = Date.now();
    const roundEndTime = roundStartTime + roundDuration;
    
    updates[`rooms/${roomId}/gameData/currentRound`] = nextRound;
    updates[`rooms/${roomId}/gameData/roundStartTime`] = roundStartTime;
    updates[`rooms/${roomId}/gameData/roundEndTime`] = roundEndTime;
    updates[`rooms/${roomId}/gameData/timerStatus`] = 'running';
    updates[`rooms/${roomId}/gameData/submittedWords`] = {}; // Reset for new round
  }
  
  await update(ref(db), updates);
};
```

### Timer Drift Scenarios & Mitigation

#### Scenario 1: Host Client Clock Drift
**Problem**: Host's system clock is fast/slow, causing timer to end early/late. 
**Mitigation**: 
- Server validates timer against server time when round ends
- If drift > 5 seconds, server corrects the timer
- Log drift incidents for monitoring

#### Scenario 2: Network Latency During Timer Updates
**Problem**: Host updates timer, but other clients receive updates late
**Mitigation**:
- Clients calculate remaining time locally using `roundEndTime - Date.now()`
- Firebase RTDB provides real-time sync for timer state changes
- Clients re-sync timer when receiving Firebase updates

#### Scenario 3: Host Disconnection During Round
**Problem**: Host leaves mid-round, timer stops updating
**Mitigation**:
- Automatic host transfer to next player
- New host takes over timer management
- Server validates timer state during host transfer

#### Scenario 4: Client-Side Timer Calculation Errors
**Problem**: JavaScript timer calculations become inaccurate over time
**Mitigation**:
- Use `Date.now()` for absolute time calculations, not `setInterval` accumulation
- Recalculate remaining time on every render: `Math.max(0, Math.ceil((roundEndTime - Date.now()) / 1000))`
- Server validates final timer state before ending round

### Pros
- **Simpler architecture**: No need for Firebase Functions or scheduled validation
- **Lower cost**: No additional cloud function costs
- **Real-time**: Immediate timer updates without polling
- **Flexible**: Easy to add features like pause/resume
- **Lower server load**: Validation only when needed

### Cons
- **Host dependency**: Relies on host being online and responsive
- **Potential timer drift**: Client clocks and calculations can drift over time
- **Security concerns**: Clients could potentially manipulate timers
- **Complexity**: Need to handle host disconnection scenarios
- **Validation gaps**: Timer accuracy only checked when round ends

## Option 3: Hybrid Approach with Proactive Server Validation

### Architecture
- **Host-managed timer**: Room host manages the authoritative timer (same as Option 2)
- **Proactive server validation**: Server automatically validates timer accuracy at regular intervals
- **Client synchronization**: Non-host clients sync with host timer via Firebase RTDB
- **Automatic monitoring**: Server checks timer state every 30 seconds without client requests

### Implementation Details

#### Enhanced Timer Component with Proactive Validation
```typescript
export const GameTimer: React.FC = () => {
  const { currentRoom } = useRoom();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isHost, setIsHost] = useState(false);
  
  const currentPlayer = user?.uid ? currentRoom?.players[user.uid] : undefined;
  const isRoomHost = currentPlayer?.isHost || false;
  
  // Client-side timer for smooth UI
  useEffect(() => {
    if (!currentRoom?.gameData) return;
    
    const { roundStartTime, roundEndTime, timerStatus } = currentRoom.gameData;
    
    if (timerStatus !== 'running') {
      setTimeLeft(0);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      setTimeLeft(remaining);
      
      // Host triggers proactive validation every 30 seconds
      if (isRoomHost && remaining > 0 && remaining % 30 === 0) {
        validateTimerWithServer(currentRoom.id);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [currentRoom?.gameData, isRoomHost]);
  
  // Rest of component...
};
```

#### Proactive Server Validation Endpoint
```typescript
// src/app/api/validate-timer/route.ts
export async function POST(request: NextRequest) {
  const { roomId } = await request.json();
  
  const room = await getRoom(roomId);
  if (!room || room.status !== 'playing') {
    return NextResponse.json({ error: 'Invalid room state' }, { status: 400 });
  }
  
  const now = Date.now();
  const roundEndTime = room.gameData?.roundEndTime;
  
  if (roundEndTime && now >= roundEndTime) {
    // Server overrides client timer
    await endCurrentRound(roomId);
    return NextResponse.json({ 
      success: true, 
      action: 'round_ended',
      message: 'Round ended by server validation'
    });
  }
  
  // Check for significant timer drift (> 5 seconds)
  const expectedRemaining = Math.ceil((roundEndTime - now) / 1000);
  const clientReportedRemaining = request.body?.clientTimeLeft;
  
  if (clientReportedRemaining && Math.abs(expectedRemaining - clientReportedRemaining) > 5) {
    // Correct timer drift
    await correctTimerDrift(roomId, expectedRemaining);
    return NextResponse.json({ 
      success: true, 
      action: 'timer_corrected',
      message: 'Timer drift detected and corrected'
    });
  }
  
  return NextResponse.json({ success: true, action: 'timer_valid' });
}
```

#### Timer Drift Correction Function
```typescript
// src/lib/firebase/round-utils.ts
export const correctTimerDrift = async (roomId: string, correctRemainingSeconds: number): Promise<void> => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const now = Date.now();
  const correctedRoundEndTime = now + (correctRemainingSeconds * 1000);
  
  await update(roomRef, {
    'gameData/roundEndTime': correctedRoundEndTime,
    'gameData/timerStatus': 'running'
  });
};
```

### Key Differences from Option 2

| Aspect | Option 2 (Reactive) | Option 3 (Proactive) |
|--------|---------------------|----------------------|
| **Validation Trigger** | Only when host requests round end | Every 30 seconds automatically |
| **Server Load** | Low - validation on-demand | Medium - regular validation requests |
| **Timer Accuracy** | Potential drift until round end | Drift detected and corrected mid-round |
| **Network Traffic** | Minimal - only when needed | Regular - every 30 seconds per active game |
| **Complexity** | Simpler - no scheduled validation | More complex - proactive monitoring |
| **Drift Detection** | Only at round end | Continuous monitoring |
| **Recovery Time** | Up to full round duration | Maximum 30 seconds |

### Enhanced Timer Drift Mitigation

#### Scenario 1: Host Client Clock Drift (Enhanced)
**Problem**: Host's system clock is fast/slow, causing timer to end early/late
**Option 2 Mitigation**: Server validates only when round ends
**Option 3 Mitigation**: 
- Server detects drift every 30 seconds
- Automatically corrects timer if drift > 5 seconds
- Logs drift incidents for monitoring
- **Recovery time**: Maximum 30 seconds vs. full round duration

#### Scenario 2: Network Latency During Timer Updates (Same)
**Problem**: Host updates timer, but other clients receive updates late
**Mitigation**: Same as Option 2 - clients calculate locally using absolute time

#### Scenario 3: Host Disconnection During Round (Enhanced)
**Problem**: Host leaves mid-round, timer stops updating
**Option 2 Mitigation**: Host transfer + server validation on new host
**Option 3 Mitigation**: 
- Same host transfer mechanism
- Additional: Server continues monitoring even during host transfer
- **Recovery time**: Faster detection of host issues

#### Scenario 4: Client-Side Timer Calculation Errors (Enhanced)
**Problem**: JavaScript timer calculations become inaccurate over time
**Option 2 Mitigation**: Server validates final state
**Option 3 Mitigation**: 
- Server detects calculation errors every 30 seconds
- Automatically corrects timer state
- **Recovery time**: Maximum 30 seconds vs. full round duration

### Pros
- **Enhanced accuracy**: Timer drift detected and corrected mid-round
- **Faster recovery**: Issues detected within 30 seconds instead of full round
- **Better monitoring**: Continuous timer health checks
- **Resilient**: Handles host disconnection and drift gracefully
- **Cost-effective**: Still no Firebase Functions needed

### Cons
- **Higher complexity**: More moving parts to coordinate
- **Increased server load**: Regular validation requests for all active games
- **More network traffic**: Validation requests every 30 seconds
- **Potential conflicts**: Client and server might disagree on timing corrections
- **Debugging complexity**: Harder to troubleshoot timing issues with multiple validation points

## Winner Announcement System

### Round Results Display
```typescript
// RoundResults component
export const RoundResults: React.FC = () => {
  const { currentRoom } = useRoom();
  const [showResults, setShowResults] = useState(false);
  
  const currentRound = currentRoom?.gameData?.currentRound || 1;
  const roundResults = currentRoom?.gameData?.roundResults?.[currentRound - 1];
  
  if (!roundResults) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Round {currentRound - 1} Results</h2>
        
        <div className="space-y-2 mb-4">
          {Object.entries(roundResults.roundScores)
            .sort(([,a], [,b]) => b - a)
            .map(([playerId, score]) => {
              const player = currentRoom.players[playerId];
              return (
                <div key={playerId} className="flex justify-between">
                  <span>{player.displayName}</span>
                  <span className="font-mono">{score} pts</span>
                </div>
              );
            })}
        </div>
        
        {roundResults.roundWinner && (
          <div className="text-center p-3 bg-yellow-100 rounded">
            <p className="font-bold text-yellow-800">
              🏆 {roundResults.roundWinner.playerName} wins this round!
            </p>
          </div>
        )}
        
        <button 
          onClick={() => setShowResults(false)}
          className="btn btn--primary btn--full mt-4"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
```

### Game Winner Announcement
```typescript
// GameWinner component
export const GameWinner: React.FC = () => {
  const { currentRoom } = useRoom();
  const router = useRouter();
  
  const gameWinner = currentRoom?.gameData?.gameWinner;
  
  if (!gameWinner) return null;
  
  const handleReturnToLobby = () => {
    router.push('/');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card p-8 max-w-lg w-full mx-4 text-center">
        <h1 className="text-3xl font-bold mb-4">🎉 Game Complete! 🎉</h1>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">
            {gameWinner.playerName}
          </h2>
          <p className="text-lg">Wins with {gameWinner.finalScore} points!</p>
        </div>
        
        <div className="space-y-2 mb-6">
          <h3 className="font-bold">Final Scores:</h3>
          {Object.entries(currentRoom.players)
            .sort(([,a], [,b]) => b.score - a.score)
            .map(([playerId, player]) => (
              <div key={playerId} className="flex justify-between">
                <span>{player.displayName}</span>
                <span className="font-mono">{player.score} pts</span>
              </div>
            ))}
        </div>
        
        <button 
          onClick={handleReturnToLobby}
          className="btn btn--primary btn--large"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
};
```

## Testing Strategy

### Unit Tests
- Timer calculation logic
- Round result calculations
- Winner determination algorithms
- Timer validation functions

### Integration Tests
- Round transition flows
- Timer synchronization between clients
- Host disconnection scenarios
- Game completion flows

### E2E Tests
- Complete game flow from start to finish
- Multi-player timer synchronization
- Winner announcement display
- Round results display

## Implementation Plan

### Phase 1: Core Timer Infrastructure (2-3 days)
1. **Database schema updates**: Add timer fields to Room interface
2. **Timer management functions**: Create round-utils.ts with core functions
3. **Enhanced GameTimer component**: Update to use server-side timer data
4. **Basic round ending**: Implement endCurrentRound function

### Phase 2: Round Management (2-3 days)
1. **Round transition logic**: Handle next round vs game end
2. **Round results calculation**: Calculate and store round scores
3. **Round results display**: Create RoundResults component
4. **Timer synchronization**: Ensure all clients see consistent timer

### Phase 3: Winner System (1-2 days)
1. **Game winner determination**: Calculate final winner
2. **Winner announcement**: Create GameWinner component
3. **Game completion flow**: Handle transition to finished state
4. **Return to lobby**: Allow players to start new games

### Phase 4: Polish & Testing (1-2 days)
1. **Error handling**: Handle edge cases and failures
2. **UI/UX improvements**: Smooth transitions and animations
3. **Comprehensive testing**: Unit, integration, and E2E tests
4. **Documentation**: Update ADRs and code comments

## Recommended Approach

**Option 2: Client-Side Timer with Server Validation (Reactive)** is recommended because:

1. **Balanced complexity**: Simpler than Option 3's proactive monitoring but more robust than pure client-side
2. **Cost-effective**: No additional cloud function costs or regular server validation overhead
3. **Real-time performance**: Immediate UI updates with server validation when needed
4. **Maintainable**: Easier to debug and modify than distributed systems with scheduled validation
5. **Fits existing architecture**: Leverages current Firebase RTDB patterns without additional complexity
6. **Lower server load**: Validation only occurs when rounds end, not every 30 seconds
7. **Sufficient accuracy**: For game rounds (typically 60-180 seconds), timer drift is minimal and acceptable

### When to Consider Option 3

Option 3 (Proactive Server Validation) should be considered if:
- **Timer accuracy is critical**: Games require precise timing (e.g., competitive tournaments)
- **Long rounds**: Rounds longer than 3-4 minutes where drift becomes more significant
- **High-stakes games**: Where timer issues could cause player disputes
- **Monitoring requirements**: Need detailed timer health metrics and drift tracking

### When to Consider Option 1

Option 1 (Firebase Functions) should be considered if:
- **Maximum reliability required**: Cannot tolerate any client-side timer issues
- **Large scale**: Hundreds of concurrent games where server load becomes a concern
- **Complex game logic**: Need server-side game state management beyond just timers

## Success Criteria

- [ ] Timer accurately counts down from room settings
- [ ] Round automatically ends when timer reaches zero
- [ ] Round results are calculated and displayed
- [ ] Game transitions between rounds correctly
- [ ] Winner is announced when game completes
- [ ] All clients see synchronized timer state
- [ ] Host disconnection is handled gracefully
- [ ] Comprehensive test coverage

## Risks and Mitigation

### Risks
- **Timer drift**: Clients might show different times
- **Host disconnection**: Timer might stop if host leaves
- **Network issues**: Timer updates might be delayed
- **Race conditions**: Multiple clients trying to end round

### Mitigation
- **Server validation**: Periodic checks ensure accuracy
- **Host transfer**: Automatic host transfer if current host leaves
- **Optimistic updates**: UI updates immediately, server validates
- **Idempotent operations**: Round ending is safe to call multiple times

## Next Steps

1. **Approve approach**: Confirm Option 2 is acceptable
2. **Database schema**: Update Room interface with timer fields
3. **Core functions**: Implement round-utils.ts functions
4. **Timer component**: Update GameTimer to use server data
5. **Round management**: Add round transition logic
6. **Winner system**: Implement winner announcement
7. **Testing**: Add comprehensive test coverage

---

*Spike completed: [Date]*
*Decision: Implement Option 2 (Client-Side Timer with Server Validation) for game timer enforcement*
