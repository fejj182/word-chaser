# ADR-009: Reversal of Session Abstraction - Room-Only Approach for MVP

## Status

**Accepted** - 2025-01-02

## Context

In [ADR-006: Session-Game Logic Separation](adr-006-session-game-logic-separation.md), we proposed a hybrid architecture that would separate "Session Logic" (reusable game session management) from "Room Management Layer" (UI adapter). This would have introduced:

- A `SessionManager` for core game session logic
- A `RoomContext` acting as an adapter layer
- Transformation functions between session and room data models
- Separation of concerns between game logic and UI presentation

## Decision

**We have decided to reverse this architectural choice and implement a simpler, Room-only approach for the MVP.**

### What We're Reversing

1. **Session abstraction layer** - No separate `SessionManager` or `SessionContext`
2. **Data transformation functions** - Direct use of Room types and Firebase utilities
3. **Adapter pattern** - RoomContext directly manages room state and operations
4. **Complex state synchronization** - Simplified state management with direct Firebase integration

### What We're Keeping

1. **Room management functionality** - All room operations remain intact
2. **Firebase integration** - Direct use of `room-utils.ts` functions
3. **Real-time subscriptions** - Firebase RTDB listeners for live updates
4. **Page unload cleanup** - Event listeners for reliable user cleanup

## Rationale

### MVP Constraints

1. **Development Velocity** - The additional abstraction layer was slowing down development
2. **Complexity vs. Benefit** - The abstraction provided minimal benefit for current use cases
3. **Team Familiarity** - Direct Firebase integration is more familiar to the team
4. **Testing Complexity** - The abstraction made testing more complex without clear benefits

### Current Architecture Benefits

1. **Simpler Mental Model** - RoomContext directly manages room state
2. **Easier Debugging** - Fewer layers to trace through when issues arise
3. **Direct Integration** - No transformation overhead between data models
4. **Faster Iteration** - Changes can be made directly without considering abstraction boundaries

### Technical Considerations

1. **State Management** - `useReducer` pattern provides sufficient structure for current needs
2. **Firebase Integration** - Direct use of `room-utils.ts` functions is clean and maintainable
3. **Real-time Updates** - Firebase subscriptions work directly with room data
4. **Error Handling** - Simplified error propagation without transformation layers

## Consequences

### Positive Consequences

1. **Faster Development** - Reduced architectural overhead
2. **Easier Maintenance** - Fewer moving parts and dependencies
3. **Better Performance** - No data transformation overhead
4. **Simpler Testing** - Direct testing of room operations
5. **Clearer Code Path** - Easier to follow data flow

### Negative Consequences

1. **Future Refactoring** - May need to extract session logic later
2. **Code Duplication** - Room logic may be duplicated if we add other contexts
3. **Tight Coupling** - Room management is tightly coupled to Firebase implementation
4. **Limited Reusability** - Room logic cannot be easily reused in other contexts

### Mitigation Strategies

1. **Clean Architecture** - Keep RoomContext focused and well-structured
2. **Extract Functions** - Move complex logic to utility functions when needed
3. **Interface Design** - Design public APIs with future abstraction in mind
4. **Documentation** - Document current architecture for future reference

## Future Considerations

### When to Reintroduce Session Abstraction

We should consider reintroducing the Session abstraction when:

1. **Multiple Contexts** - We need room logic in multiple React contexts
2. **Game Logic Separation** - Game session logic becomes complex enough to warrant separation
3. **Testing Requirements** - We need to test game logic independently of UI
4. **Performance Issues** - Data transformation becomes a bottleneck
5. **Team Growth** - Multiple teams need to work on different aspects

### Migration Strategy

When reintroducing Session abstraction:

1. **Incremental Approach** - Extract session logic piece by piece
2. **Backward Compatibility** - Maintain existing RoomContext API during transition
3. **Parallel Implementation** - Build new abstraction alongside existing code
4. **Gradual Migration** - Migrate one feature at a time
5. **Comprehensive Testing** - Ensure no regressions during migration

### Alternative Approaches

Instead of full Session abstraction, consider:

1. **Custom Hooks** - Extract complex logic into custom hooks
2. **Utility Functions** - Move business logic to pure functions
3. **Service Layer** - Create service classes for complex operations
4. **State Machines** - Use XState or similar for complex state transitions

## Implementation Details

### Current Architecture

```
RoomContext (Provider)
├── State Management (useReducer)
├── Firebase Integration (room-utils.ts)
├── Real-time Subscriptions
├── Page Unload Cleanup
└── Public API (createRoom, joinRoom, etc.)
```

### Key Components

1. **RoomContext.tsx** - Main context provider with room state and operations
2. **room-utils.ts** - Firebase RTDB operations and utilities
3. **room.ts** - TypeScript interfaces for room data
4. **RoomContext.test.tsx** - Comprehensive test coverage

### State Management

- **useReducer** for predictable state transitions
- **Actions**: SET_LOADING, SET_ERROR, SET_ROOM, SET_ROOM_ID, CLEAR_ROOM
- **State**: currentRoom, isLoading, error, roomId

### Firebase Integration

- **Direct calls** to `room-utils.ts` functions
- **Real-time subscriptions** via `subscribeToRoom`
- **Automatic cleanup** on component unmount
- **Error handling** with try-catch blocks

## Testing Strategy

### Current Test Coverage

1. **Unit Tests** - RoomContext operations and state management
2. **Integration Tests** - Firebase operations with emulators
3. **Component Tests** - UI components using RoomContext
4. **E2E Tests** - Full user workflows

### Test Principles

1. **Mock External Dependencies** - Firebase utilities in unit tests
2. **Test State Transitions** - Verify reducer actions work correctly
3. **Test Error Scenarios** - Ensure errors are handled gracefully
4. **Test Cleanup** - Verify event listeners and subscriptions are cleaned up

## Conclusion

The decision to reverse the Session abstraction architectural choice is driven by MVP constraints and the need for faster development velocity. While this approach may require future refactoring, it provides immediate benefits in terms of simplicity, maintainability, and development speed.

The current Room-only architecture is well-tested, performant, and maintainable. When the need for Session abstraction becomes clear, we have a solid foundation to build upon and a clear migration path forward.

## References

- [ADR-006: Session-Game Logic Separation](adr-006-session-game-logic-separation.md) - Original architectural proposal
- [RoomContext.tsx](../../src/features/room-management/contexts/RoomContext.tsx) - Current implementation
- [room-utils.ts](../../src/lib/firebase/room-utils.ts) - Firebase integration utilities
- [RoomContext.test.tsx](../../src/features/room-management/contexts/__tests__/RoomContext.test.tsx) - Test coverage
