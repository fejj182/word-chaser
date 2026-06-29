```mermaid
graph TD
    subgraph Frontend ["Next.js Application"]
        A[Player's Browser / Device] --> B(Next.js Client-Side App)
        B -- Real-time Updates (WebSockets via Firebase SDK) --> C(Firebase Client SDK)
        B -- AI Hints/Logic Requests --> E
    end

    subgraph Backend ["Serverless Cloud Services - Firebase"]
        subgraph Real-time & Database
            C -- Manages Connections & Data Sync --> D1(Firebase Realtime Database <br> Fast, frequent game state)
            D1 -- Triggers --> E
        end

        subgraph Serverless Functions ["Backend Logic & AI"]
            E(Firebase Cloud Functions <br> Game Logic, AI Integration)
            E -- Calls External API --> F(Generative AI Service <br> e.g., Google Gemini API)
        end

        subgraph Authentication & Storage
            G[Firebase Authentication]
            H[Firebase Storage <br> Optional: for game assets]
        end
    end

    subgraph Deployment & Management
        I[Vercel / Netlify <br> for Next.js App]
        J[Firebase Console <br> for Backend Services]
    end

    A -- Accesses --> I
    I -- Serves --> B
    B -. Authenticates via .-> G
    B -. Accesses .-> H

    style A fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style B fill:#e0f2f7,stroke:#3498db,stroke-width:2px
    style C fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style D1 fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style E fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style F fill:#fff2e6,stroke:#e67e22,stroke-width:2px
    style G fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style H fill:#f0f7f4,stroke:#2ecc71,stroke-width:2px
    style I fill:#f0f0f0,stroke:#95a5a6,stroke-width:1px
    style J fill:#f0f0f0,stroke:#95a5a6,stroke-width:1px
```
