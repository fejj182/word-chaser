# ADR 004: Reducer Pattern for Client-Side State Management

## Status

Accepted

## Context

Following the decisions to use Firebase Realtime Database for real-time game state (ADR 002) and Client Components for interactive room management (ADR 003), we needed to establish a pattern for managing complex client-side state. The application requires handling multiple concurrent state concerns including:

- Real-time room state updates from Firebase subscriptions
- Loading states during async operations (create/join/leave room)
- Error states for failed operations
- Complex state transitions (e.g., room creation → subscription → real-time updates)
- Predictable state updates across multiple components

The state management solution needed to work seamlessly with Firebase Realtime Database subscriptions while providing a clear, debuggable pattern for state transitions.

## Decision

We will use the **Reducer Pattern with React's `useReducer` hook** for managing complex client-side state in contexts that require predictable state transitions and real-time updates.

### Implementation Details:

- **RoomContext**: Uses `useReducer` with a `roomReducer` function to manage room state, loading states, and errors
- **State Structure**: Immutable state updates following the reducer pattern
- **Action Types**: Typed actions for predictable state transitions
- **Integration**: Works with Firebase subscriptions to update state in real-time

### Example Implementation:

```typescript
type RoomAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_ROOM_ID'; payload: string }
  | { type: 'CLEAR_ROOM' };

const roomReducer = (state: RoomState, action: RoomAction): RoomState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    // ... other cases
  }
};
```

## Consequences

### Positive

* **Predictable State Transitions**: All state changes follow a clear, typed action pattern that's easy to debug and test
* **Real-time Integration**: Works seamlessly with Firebase subscriptions by dispatching actions when data changes
* **Complex State Management**: Handles multiple concurrent state concerns (loading, errors, data) in a single, predictable flow
* **Debugging**: State transitions are easily traceable through action types and payloads
* **Type Safety**: TypeScript ensures all actions and state updates are properly typed
* **Testability**: Reducer functions are pure functions that can be easily unit tested
* **Consistency**: Provides a uniform pattern for state management across the application

### Negative

* **Boilerplate**: Requires more code compared to simple `useState` hooks
* **Learning Curve**: Developers unfamiliar with the reducer pattern may need time to understand the pattern
* **Overhead for Simple State**: May be overkill for very simple state management needs
* **Action Type Management**: Requires maintaining action type definitions and ensuring consistency

### Neutral

* **Architectural Pattern**: Aligns with established React patterns and Redux principles
* **Scalability**: Pattern scales well as application complexity grows
* **Performance**: No significant performance impact compared to other state management approaches

## Alternatives Considered

### 1. Plain `useState` Hooks
* **Pros**: Simple, familiar, less boilerplate
* **Cons**: Difficult to manage complex state transitions, harder to debug, prone to race conditions with real-time updates
* **Decision**: Rejected due to complexity of managing multiple related state pieces

### 2. Zustand
* **Pros**: Lightweight, simple API, good TypeScript support
* **Cons**: Less predictable state transitions, harder to debug complex flows
* **Decision**: Rejected due to need for predictable state transitions with real-time data

### 3. TanStack Query + Server Actions
* **Pros**: Excellent for server state management, built-in caching and synchronization
* **Cons**: Not designed for real-time client state, overkill for simple state management
* **Decision**: Rejected as it's better suited for server state, not client state

### 4. Redux Toolkit
* **Pros**: Powerful, mature, excellent dev tools
* **Cons**: Significant overhead, complex setup, overkill for this use case
* **Decision**: Rejected due to simplicity goals and the fact that we only need client-side state management

### 5. Server Actions (Next.js 13+)
* **Pros**: Modern Next.js pattern, good for form submissions
* **Cons**: Cannot handle real-time updates, client-side state, or complex state transitions
* **Decision**: Rejected as it's not suitable for real-time, client-side state management

## Implementation Notes

* The reducer pattern is used specifically in contexts that require complex state management (RoomContext, UserContext)
* Simple components continue to use `useState` for local component state
* All reducer actions are typed with TypeScript for better developer experience
* Firebase subscriptions dispatch actions to update state, maintaining the single source of truth
* Error handling is integrated into the reducer pattern for consistent error state management
* Loading states are managed through the reducer to provide consistent loading UX

## Related ADRs

* **ADR 001:** Serverless Stack Choice - Established the Firebase foundation
* **ADR 002:** Firebase Realtime Database - Determined the database choice for real-time game state
* **ADR 003:** Client Component Usage - Established the need for client-side interactivity

## Future Considerations

* As the application grows, we may consider introducing more sophisticated state management patterns
* The reducer pattern can be extended to handle more complex state transitions as game features expand
* Consider implementing Redux DevTools integration for enhanced debugging capabilities
* Evaluate the need for state persistence for offline scenarios

This decision ensures that our real-time multiplayer game has robust, predictable state management that can handle the complexity of live game state while maintaining code clarity and debuggability.
