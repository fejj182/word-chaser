# Session-Room Architecture Diagram

## Before Refactoring (Monolithic Architecture)

```mermaid
graph TB
    subgraph "UI Components"
        A[RoomManager]
        B[CreateRoom]
        C[JoinRoom]
        D[RoomLobby]
    end
    
    subgraph "State Management"
        E[RoomContext]
        F[useReducer]
    end
    
    subgraph "Firebase Layer"
        G[room-utils.ts]
        H[Firebase Realtime DB]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    E --> G
    G --> H
    
    style E fill:#ff9999
    style G fill:#ff9999
```

**Problems:**
- Room logic mixed with Firebase implementation
- No separation between session and game logic
- Difficult to extract reusable components
- UI terminology tightly coupled to backend logic

## After Refactoring (Layered Architecture)

```mermaid
graph TB
    subgraph "UI Layer (Room Terminology)"
        A[RoomManager]
        B[CreateRoom]
        C[JoinRoom]
        D[RoomLobby]
    end
    
    subgraph "Adapter Layer"
        E[RoomContext]
        F[Transform Functions]
    end
    
    subgraph "Session Layer (Session Terminology)"
        G[SessionContext]
        H[SessionManager Interface]
        I[Session Types]
    end
    
    subgraph "Firebase Layer"
        J[room-utils.ts]
        K[Firebase Realtime DB]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    J --> K
    
    style E fill:#99ccff
    style G fill:#99ff99
    style H fill:#99ff99
    style I fill:#99ff99
```

## Detailed Architecture Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant RC as RoomContext
    participant TF as Transform Functions
    participant SC as SessionContext
    participant SM as SessionManager
    participant FB as Firebase Utils
    participant DB as Firebase DB

    Note over UI,DB: Create Room Flow
    UI->>RC: createRoom(params, alias)
    RC->>TF: transformRoomParamsToSessionParams(params)
    RC->>SC: createSession(sessionParams, alias)
    SC->>SM: createSession(sessionParams, alias)
    SM->>FB: createRoom(params, alias)
    FB->>DB: Create room in Firebase
    DB-->>FB: Room created
    FB-->>SM: Room ID
    SM-->>SC: Session ID
    SC-->>RC: Session ID
    RC->>TF: transformSessionToRoom(session)
    RC-->>UI: Room data

    Note over UI,DB: Real-time Updates
    DB->>FB: Room data changed
    FB->>SM: subscribeToRoom callback
    SM->>SC: subscribeToSession callback
    SC->>RC: Session data updated
    RC->>TF: transformSessionToRoom(session)
    RC->>UI: Room data updated
```

## Provider Hierarchy

```mermaid
graph TD
    A[App Root]
    B[UserProvider]
    C[SessionProvider]
    D[RoomProvider]
    E[UI Components]
    
    A --> B
    B --> C
    C --> D
    D --> E
    
    subgraph "Session Layer"
        C
    end
    
    subgraph "Room Layer"
        D
    end
    
    subgraph "UI Layer"
        E
    end
```

## Data Flow Transformation

```mermaid
graph LR
    subgraph "Session Data (Backend)"
        A[Session]
        B[SessionPlayer]
        C[CreateSessionParams]
    end
    
    subgraph "Transformation Layer"
        D[transformSessionToRoom]
        E[transformSessionPlayerToPlayer]
        F[transformRoomParamsToSessionParams]
    end
    
    subgraph "Room Data (UI)"
        G[Room]
        H[Player]
        I[CreateRoomParams]
    end
    
    A --> D --> G
    B --> E --> H
    I --> F --> C
    
    style D fill:#ffff99
    style E fill:#ffff99
    style F fill:#ffff99
```

## Key Benefits Visualization

```mermaid
mindmap
  root((Session-Room<br/>Architecture))
    Reusability
      Library Extraction Ready
      Generic Session Logic
      UI Terminology Agnostic
    User Experience
      Familiar Room Terminology
      No Breaking Changes
      Consistent Interface
    Developer Experience
      Clear Separation of Concerns
      Strong TypeScript Support
      Testable Architecture
    Maintainability
      Independent Layer Evolution
      Game Logic Separation
      Clear Mock Boundaries
```

## Future Library Extraction

```mermaid
graph TB
    subgraph "Future Library"
        A[SessionManager Interface]
        B[SessionContext]
        C[Session Types]
        D[Firebase Adapter]
    end
    
    subgraph "Word Chaser App"
        E[RoomContext Adapter]
        F[Word Chaser Game Logic]
        G[UI Components]
    end
    
    subgraph "Other Games"
        H[LobbyContext Adapter]
        I[MatchContext Adapter]
        J[Game-Specific Logic]
    end
    
    A --> E
    A --> H
    A --> I
    B --> E
    B --> H
    B --> I
    C --> E
    C --> H
    C --> I
    D --> E
    D --> H
    D --> I
    
    E --> F
    E --> G
    H --> J
    I --> J
    
    style A fill:#99ff99
    style B fill:#99ff99
    style C fill:#99ff99
    style D fill:#99ff99
```

## Component Responsibility Matrix

| Layer | Components | Responsibilities | Terminology |
|-------|------------|------------------|-------------|
| **UI Layer** | RoomManager, CreateRoom, JoinRoom, RoomLobby | User interface, user interactions | Room |
| **Adapter Layer** | RoomContext, Transform Functions | Data transformation, UI abstraction | Room ↔ Session |
| **Session Layer** | SessionContext, SessionManager, Session Types | Core session logic, state management | Session |
| **Firebase Layer** | room-utils.ts | Database operations, real-time subscriptions | Implementation |

## Migration Path

```mermaid
graph LR
    A[Monolithic RoomContext] --> B[Extract Session Logic]
    B --> C[Create SessionContext]
    C --> D[Create Transform Functions]
    D --> E[Update RoomContext as Adapter]
    E --> F[Update UI Components]
    F --> G[Test & Validate]
    G --> H[Library Ready]
    
    style A fill:#ff9999
    style H fill:#99ff99
```

This architecture enables:
- **Immediate**: Clean separation of session and game logic
- **Short-term**: Building Word Chaser game logic on stable foundation
- **Long-term**: Extracting session management as reusable library
