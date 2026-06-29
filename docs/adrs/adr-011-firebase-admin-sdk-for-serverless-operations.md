# ADR 011: Firebase Admin SDK for Serverless Operations

## Status

Accepted

## Context

Following the implementation of player score updates in the Realtime Database (ADR 010), we encountered a permission error when attempting to update player scores from API routes. The issue was that Firebase client SDK operations in serverless functions (Next.js API routes) are subject to security rules that require user authentication context, but serverless functions run without user authentication.

The error occurred because:
- **Client SDK**: Requires user authentication context (`auth != null`)
- **API Routes**: Run server-side without user context
- **Security Rules**: Designed for client-side operations with authenticated users

This created a conflict between our serverless architecture and Firebase security model.

## Decision

We will use **Firebase Admin SDK** for all server-side operations in API routes, while maintaining the client SDK for client-side operations.

### Implementation Details

1. **Server-side Operations**: Use Firebase Admin SDK in API routes
   - Word validation and score updates
   - Any future server-side database operations
   - Bypasses security rules with admin privileges

2. **Client-side Operations**: Continue using Firebase client SDK
   - Real-time subscriptions to room data
   - User authentication
   - Client-side database reads/writes (subject to security rules)

3. **Environment Configuration**:
   - **Development**: Admin SDK uses default credentials with emulators
   - **Production**: Admin SDK uses service account credentials from environment configuration

## Consequences

### Positive

- **Resolves Permission Issues**: Serverless functions can perform trusted database operations without authentication context
- **Maintains Security Model**: Client-side operations still use security rules, server-side operations are trusted
- **Industry Standard**: This is the standard pattern for Firebase serverless applications
- **Scalable**: Admin SDK works with all serverless platforms (Vercel, Netlify, AWS Lambda)
- **Separation of Concerns**: Clear distinction between client and server operations

### Negative

- **Additional Dependency**: Requires `firebase-admin` package
- **Credential Management**: Production deployments need service account setup
- **Code Duplication**: Some operations exist in both client and admin versions

### Neutral

- **Architecture Complexity**: Slightly more complex than pure client-side, but necessary for security
- **Deployment Requirements**: Production deployments need proper credential configuration

## Implementation

### Files Added/Modified

- `src/lib/firebase/admin.ts` - Admin SDK initialization
- `src/lib/firebase/admin-room-utils.ts` - Server-side room operations
- `src/app/api/validate-word/route.ts` - Uses Admin SDK for score updates
- `package.json` - Added `firebase-admin` dependency

### Environment Variables

```bash
# Development (emulators) - no additional setup needed
NEXT_PUBLIC_USE_EMULATORS=true

# Production - service account JSON
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

### Security Model

```
Client Operations (Client SDK) → Security Rules → Database
Server Operations (Admin SDK) → Bypass Rules → Database
```

## Alternatives Considered

### Option 1: Modify Security Rules
- **Approach**: Allow serverless functions to bypass authentication
- **Rejected**: Less secure, harder to maintain, not recommended by Firebase

### Option 2: Client-Side Only
- **Approach**: Move all operations to client-side
- **Rejected**: Vulnerable to cheating, no server-side validation

### Option 3: Custom Authentication
- **Approach**: Implement custom auth for serverless functions
- **Rejected**: Overly complex, unnecessary for this use case

## References

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Next.js API Routes with Firebase](https://firebase.google.com/docs/web/setup#nextjs)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
