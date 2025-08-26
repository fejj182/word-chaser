# ADR 003: Client Component Usage for Interactive Room Management

## Status

Accepted

## Context

Following the implementation of the Create Room logic and UI using Firebase Realtime Database (ADR 002), we encountered Next.js 13+ App Router errors when components using React hooks were imported without the `'use client'` directive. The error message indicated that React hooks like `useEffect`, `useState`, and `useContext` only work in Client Components, but our components were being treated as Server Components by default.

The room management feature requires extensive client-side interactivity including:
- Real-time Firebase database subscriptions
- Form state management with React hooks
- User interactions (button clicks, form submissions)
- Browser APIs (clipboard operations)
- Dynamic UI updates based on room state changes

## Decision

We will use **Client Components** for all interactive room management components by adding the `'use client'` directive to components that require React hooks, browser APIs, or event handlers.

### Components marked as Client Components:

1. **`src/features/shared/components/CreateRoom.tsx`** - Uses `useState` and `useRoom`
2. **`src/features/shared/components/CreateRoomForm.tsx`** - Uses `useState` for form management
3. **`src/features/shared/contexts/RoomContext.tsx`** - Uses `useReducer`, `useEffect`, `useContext`, and `useAuth`
4. **`src/features/shared/components/JoinRoom.tsx`** - Uses `useState` and `useRoom`
5. **`src/features/shared/components/RoomManager.tsx`** - Uses `useState` and `useRoom`

6. **`src/features/shared/components/RoomLobby.tsx`** - Uses `useRoom` and `useAuth`
7. **`src/app/page.tsx`** - Uses `useAuth` in the `AuthenticatedContent` component

### Components that already had `'use client'`:

1. **`src/features/guest-auth/contexts/UserContext.tsx`** - Already properly configured
2. **`src/features/guest-auth/components/UserDisplay.tsx`** - Already properly configured

## Consequences

### Positive

* **Functionality Works as Expected:** All React hooks, browser APIs, and event handlers function properly
* **Real-time Updates:** Firebase Realtime Database subscriptions work correctly for live room state updates
* **Interactive User Experience:** Forms, buttons, and dynamic UI updates work seamlessly
* **State Management:** React state and context provide reliable state management for complex room interactions
* **No Runtime Errors:** Eliminates Next.js App Router errors about hooks in Server Components

### Negative

* **Increased Bundle Size:** Client Components are included in the JavaScript bundle sent to the browser, increasing initial download size
* **Delayed Interactivity:** Components require JavaScript to be loaded and executed before becoming interactive, unlike Server Components which can render HTML immediately
* **SEO Considerations:** Server Components are generally better for SEO since they render on the server, but this is less critical for interactive game features

### Neutral

* **Architectural Consistency:** Aligns with Next.js 13+ best practices for interactive features
* **Development Experience:** Maintains familiar React patterns and debugging capabilities

## Alternatives Considered

* **Server Actions:** While suitable for form submissions, cannot handle real-time updates or complex state management required for room management
* **Static Rendering:** Not suitable for dynamic, real-time game state that changes frequently
* **API Routes + Client State:** Would add unnecessary complexity and network overhead for features that inherently require client-side execution
* **Hybrid Approach:** Using Server Components for static parts and Client Components for interactive parts, but this would fragment the component architecture unnecessarily

## Implementation Notes

* The `'use client'` directive must be placed at the very top of the file, before any imports
* Layout components (`src/app/layout.tsx`) remain as Server Components since they don't require interactivity
* All room management components are consistently marked as Client Components to maintain architectural clarity
* The trade-offs are acceptable given that room management is inherently client-side functionality

## Related ADRs

* **ADR 001:** Serverless Stack Choice - Established the Firebase foundation
* **ADR 002:** Firebase Realtime Database - Determined the database choice for real-time game state

This decision ensures that our room management feature works correctly while following Next.js 13+ best practices for interactive applications.
