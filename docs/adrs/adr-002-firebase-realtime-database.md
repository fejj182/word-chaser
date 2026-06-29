# ADR 002: Real-time Database Choice for Core Game State

## Status

Accepted

## Context

Following the decision to use a serverless Firebase stack (ADR 001), we must select the appropriate database for managing the **core, real-time game state**. This state is ephemeral and characterized by high-frequency, low-latency updates from multiple clients simultaneously. Key data includes player presence in a lobby, the live game board state, real-time word submissions, and in-game scores. The choice must align with our primary project goals of **development speed, architectural simplicity, and cost-effectiveness** for an MVP. The decision is primarily between Firebase's two database offerings: Cloud Firestore and Realtime Database (RTDB).

## Decision

We will use **Firebase Realtime Database (RTDB)** for managing all core, ephemeral game and lobby state.

* This includes lobby creation, player join/leave events, the active game board, word submissions during a round, and live score updates.
* RTDB will serve as the "single source of truth" that clients subscribe to during an active game session.

## Consequences

### Positive

* **Optimized for Low Latency:** RTDB is purpose-built for high-frequency state synchronization and generally offers the lowest possible latency, which is critical for creating a responsive, "live" feel in a fast-paced word game. 🏎️
* **Cost-Effective for Game Loops:** The pricing model is based on storage and bandwidth, not per-operation. A game with many small, rapid updates (e.g., a player joining, a timer tick) will incur minimal bandwidth costs, which is significantly more economical than paying for each individual read/write operation as required by Firestore.
* **Simpler Data Model for this Use Case:** The simple JSON tree structure of RTDB is a more direct and easier-to-manage model for the relatively simple, nested structure of a single game state. This reduces development complexity for the MVP.

### Negative

* **Limited Querying Capabilities:** RTDB lacks the powerful indexing and querying features of Firestore. It is inefficient for complex queries on historical data (e.g., "find all games where a user scored over 100"). Features that need this should be modeled deliberately instead of bolted onto the live game state tree.
* **Scalability Constraints at Massive Scale:** While more than sufficient for an MVP and significant growth, RTDB's scaling is less robust than Firestore's multi-region, globally distributed architecture. Scaling to millions of concurrent users would require additional architecture such as manual sharding.
* **Less-Structured:** The flexibility of a single JSON tree can lead to less-enforced data structures if not managed carefully in the application code.

### Alternatives Considered

* **Cloud Firestore as primary real-time state:** This was the main alternative. It was not chosen for the core game loop primarily due to its pricing model, which would be more expensive for our high-frequency update pattern. Furthermore, its slightly higher latency and more complex data modeling for this specific use case made RTDB a better fit for our "speed and simplicity" goal.
* **Self-Managed WebSocket Server:** This option provides maximum control but introduces significant architectural complexity, infrastructure management, and operational overhead, directly conflicting with the project's core serverless and simplicity principles.
