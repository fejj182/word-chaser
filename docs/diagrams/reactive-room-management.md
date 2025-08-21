# Reactive Room Management Architecture

This diagram illustrates the reactive pattern used for room management in the Word Chaser application, showing how real-time updates flow from Firebase Realtime Database through the React context system to automatically update the UI.

```mermaid
graph TD
    subgraph Frontend ["Next.js Client Components"]
        A[User Interface Components] --> B[RoomManager Component]
        B --> C[CreateRoom Component]
        B --> D[JoinRoom Component]
        B --> E[RoomLobby Component]
        
        subgraph State Management ["React Context & Hooks"]
            F[RoomContext Provider]
            G[useRoom Hook]
            H[useReducer State]
        end
        
        A --> G
        G --> F
        F --> H
    end

    subgraph Firebase Integration ["Firebase SDK & Utils"]
        I[Firebase Client SDK]
        J[room-utils.ts]
        K[Firebase Realtime Database]
        
        subgraph Subscription System ["Real-time Subscriptions"]
            L[subscribeToRoom Function]
            M[onValue Listener]
            N[Database Callback]
        end
    end

    subgraph Data Flow ["Reactive Data Flow"]
        O[User Action]
        P[Database Update]
        Q[Subscription Trigger]
        R[State Update]
        S[UI Re-render]
    end

    %% Component connections
    C --> F
    D --> F
    E --> F
    
    %% Firebase connections
    F --> I
    I --> J
    J --> K
    
    %% Subscription flow
    J --> L
    L --> M
    M --> K
    K --> N
    N --> L
    
    %% Data flow connections
    O --> P
    P --> Q
    Q --> R
    R --> S
    
    %% Cross-system connections
    L --> F
    F --> H
    H --> A

    %% Styling
    style A fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style B fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style C fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style D fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style E fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style F fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style G fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style H fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style I fill:#fff2e6,stroke:#e67e22,stroke-width:2px
    style J fill:#fff2e6,stroke:#e67e22,stroke-width:2px
    style K fill:#fff2e6,stroke:#e67e22,stroke-width:2px
    style L fill:#f9f2f4,stroke:#9b59b6,stroke-width:2px
    style M fill:#f9f2f4,stroke:#9b59b6,stroke-width:2px
    style N fill:#f9f2f4,stroke:#9b59b6,stroke-width:2px
    style O fill:#e8f5e8,stroke:#27ae60,stroke-width:2px
    style P fill:#e8f5e8,stroke:#27ae60,stroke-width:2px
    style Q fill:#e8f5e8,stroke:#27ae60,stroke-width:2px
    style R fill:#e8f5e8,stroke:#27ae60,stroke-width:2px
    style S fill:#e8f5e8,stroke:#27ae60,stroke-width:2px
```

## Key Components

### Frontend Layer
- **User Interface Components**: React components that render the room management UI
- **RoomManager**: Main orchestrator component that switches between different views
- **CreateRoom/JoinRoom/RoomLobby**: Specific UI components for different room states
- **State Management**: React Context and hooks that manage application state

### Firebase Integration Layer
- **Firebase Client SDK**: Official Firebase JavaScript SDK
- **room-utils.ts**: Custom utility functions for room operations
- **Firebase Realtime Database**: Real-time database for storing room state
- **Subscription System**: Real-time listeners that detect database changes

### Data Flow Layer
- **User Action**: User interactions (clicking buttons, submitting forms)
- **Database Update**: Changes made to the Firebase database
- **Subscription Trigger**: Real-time detection of database changes
- **State Update**: React state updates triggered by database changes
- **UI Re-render**: Automatic UI updates based on state changes

## Reactive Pattern Flow

1. **User performs an action** (e.g., joins a room)
2. **Component calls room utility function** (e.g., `joinRoom()`)
3. **Firebase database is updated** with the new room state
4. **Subscription listener detects the change** via `onValue`
5. **Callback function is triggered** with updated room data
6. **React Context state is updated** via `dispatch()`
7. **UI automatically re-renders** to reflect the new state
8. **User sees the updated interface** (e.g., switches to lobby view)

## Benefits of This Pattern

- **Real-time Updates**: All connected users see changes immediately
- **Automatic UI Updates**: No manual state management required
- **Consistency**: UI always reflects the actual database state
- **Reliability**: Works even after page refreshes
- **Scalability**: Handles multiple concurrent users efficiently
