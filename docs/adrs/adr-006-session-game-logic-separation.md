# ADR-006: Session Logic and Game Logic Separation with Hybrid Room/Session Architecture

## Status

Accepted

## Context

As part of the plan to build Word Chaser as a flagship demo and then extract reusable session management into a library, we needed to cleanly separate "Session Logic" from "Game Logic" while maintaining a user-friendly interface.

**Session Logic** (Generic, Reusable):
- `createRoom()`, `joinRoom()`, `leaveRoom()`
- `setReady(true)`, `playerJoined`, `hostChanged`, `gameStarted`
- Real-time subscriptions and state management

**Game Logic** (Word Chaser Specific):
- `submitWord(word)`, `startRoundTimer()`, `calculateScore()`
- Game-specific state and rules

## Decision

We implemented a **hybrid architecture** with two distinct layers:

### 1. Session Management Layer (Backend)
- **Terminology**: Uses "Session" terminology for reusability
- **Location**: `src/features/session-management/`
- **Purpose**: Generic, reusable session management logic
- **Interface**: `SessionManager` with clear contracts

### 2. Room Management Layer (UI Adapter)
- **Terminology**: Uses "Room" terminology for user familiarity
- **Location**: `src/features/room-management/`
- **Purpose**: Translates between Session and Room concepts
- **Interface**: `useRoom` hook with Room-specific types

## Consequences

### Positive

#### Reusability
- Session logic can be extracted into a library without UI terminology constraints
- Future games can use different UI terminology while reusing session logic
- Clear separation allows independent evolution of session and game logic

#### User Experience
- UI maintains familiar "Room" terminology that users understand
- No breaking changes for end users during refactoring
- Consistent interface across the application

#### Developer Experience
- Clear separation of concerns with well-defined boundaries
- Strong TypeScript support with proper interfaces
- Transformation functions provide type safety between layers

#### Maintainability
- Changes to session logic don't require UI updates
- Game logic can be developed independently
- Testable architecture with clear mock boundaries

### Negative

#### Complexity
- Additional layer of abstraction increases complexity
- Transformation functions between Session and Room types
- Need to maintain two sets of type definitions

#### Learning Curve
- Developers need to understand both Session and Room concepts
- Clear documentation required for the transformation layer
- Potential confusion about when to use which terminology

## Implementation Details

### Session Management Layer

```typescript
// Core interface for reusable session logic
export interface SessionManager {
  createSession(params: CreateSessionParams, alias: string): Promise<string>;
  joinSession(sessionId: string, alias: string): Promise<void>;
  leaveSession(): Promise<void>;
  setPlayerReady(isReady: boolean): Promise<void>;
  startSession(): Promise<void>;
  subscribeToSession(sessionId: string, callback: (session: Session | null) => void): () => void;
}
```

### Room Management Layer (Adapter)

```typescript
// Transformation functions between Session and Room concepts
const transformSessionToRoom = (session: Session): Room => ({ /* ... */ });
const transformSessionPlayerToPlayer = (sessionPlayer: SessionPlayer): Player => ({ /* ... */ });
const transformRoomParamsToSessionParams = (roomParams: CreateRoomParams): CreateSessionParams => ({ /* ... */ });
```

### Provider Hierarchy

```typescript
<SessionProvider>
  <RoomProvider>
    {children}
  </RoomProvider>
</SessionProvider>
```

## Related Decisions

- [ADR-004: Reducer Pattern for State Management](./adr-004-reducer-pattern-state-management.md) - Used for SessionContext state management
- [ADR-002: Firebase Realtime Database](./adr-002-firebase-realtime-database.md) - Session layer directly interacts with Firebase
- [ADR-003: Client Component Usage](./adr-003-client-component-usage.md) - Both layers use client components

## Future Considerations

### Library Extraction
- Session management layer is designed to be extracted as a standalone library
- Room management layer can be replaced with different UI adapters
- Clear interfaces allow for different backend implementations

### Game Logic Integration
- Game-specific logic will be built on top of the session layer
- Game state can be stored in `Session.gameState` for persistence
- Game events can leverage session real-time capabilities

### Alternative UI Terminologies
- Future games can implement different adapter layers
- Examples: "Lobby" terminology, "Match" terminology, etc.
- Session layer remains unchanged regardless of UI terminology

## References

- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles) - Used for improved test quality
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context) - Applied for state management
- [TypeScript Interface Design](https://www.typescriptlang.org/docs/handbook/interfaces.html) - Used for clear contracts
