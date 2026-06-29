# ADR 010: Firebase Realtime Database Security Rules Implementation

## Status

Accepted

## Context

Following the adoption of Firebase Realtime Database (RTDB) for core game state management (ADR 002), we need to implement security rules to protect our multiplayer word game from unauthorized access and malicious behavior. The game involves multiple players joining rooms, creating and managing game sessions, and real-time collaboration on word submissions.

Key security requirements identified:
- **Authentication**: Only authenticated users can access game data
- **Authorization**: Players can only modify their own data and hosts can manage room settings
- **Data Integrity**: Prevent unauthorized room creation, player impersonation, and malicious data manipulation
- **Room Management**: Ensure only room hosts can modify room settings and manage the game state

The security rules must balance security with the real-time, collaborative nature of the game while maintaining the simplicity benefits that led us to choose RTDB.

## Decision

We will implement comprehensive Firebase Realtime Database security rules in `src/lib/firebase/config/database.rules.json` with the following structure:

### Room Access Control
```json
"rooms": {
  "$roomId": {
    ".read": "auth != null",
    ".write": "auth != null && ((!data.exists() && newData.child('createdBy').val() === auth.uid) || (data.exists() && root.child('rooms/' + $roomId + '/players/' + auth.uid + '/isHost').val() === true))",
    "players": {
      "$uid": {
        ".write": "auth.uid === $uid"
      }
    },
    "settings": {
      ".write": "data.parent().child('createdBy').val() === auth.uid"
    }
  }
}
```

### Slug Management Security
```json
"slugs": {
  "$slugId": {
    ".read": "auth != null",
    ".write": "auth != null && root.child('rooms/' + (newData.exists() ? newData.val() : data.val()) + '/players/' + auth.uid + '/isHost').val() === true",
    ".validate": "newData.isString()"
  }
}
```

## Consequences

### Positive

* **Comprehensive Access Control**: Rules ensure only authenticated users can read game data and only authorized users can modify specific parts of the data structure
* **Player Data Protection**: Each player can only modify their own player data, preventing impersonation and unauthorized score manipulation
* **Host Privilege Enforcement**: Room hosts (identified by `isHost: true` and `createdBy` fields) have exclusive rights to modify room settings and manage game state
* **Slug Security**: Room slugs are protected from unauthorized modification while allowing hosts to manage their room's public identifier
* **Data Validation**: Basic validation ensures slugs are strings, preventing malformed data injection
* **Real-time Security**: Rules work seamlessly with RTDB's real-time capabilities without adding latency or complexity to the client-side code

### Negative

* **Rule Complexity**: The security rules are more complex than simple read/write permissions, requiring careful maintenance and testing
* **Debugging Challenges**: Security rule violations can be difficult to debug, especially with nested conditions and cross-references
* **Limited Validation**: RTDB security rules provide basic validation but lack the sophisticated data validation capabilities of Firestore
* **Testing Overhead**: Security rules must be thoroughly tested in both emulator and production environments

### Security Considerations

* **Authentication Dependency**: All security relies on Firebase Authentication being properly configured and users being authenticated
* **UID Trust**: Rules assume that `auth.uid` is trustworthy and cannot be spoofed by clients
* **Host Privilege Escalation**: **RESOLVED** - The `isHost` flag is now protected by additional security rules that prevent unauthorized privilege escalation
* **Cross-Reference Validation**: Rules use cross-references between different parts of the database, which could be vulnerable to race conditions

## Implementation Details

### Rule Structure Breakdown

1. **Room Read Access**: `auth != null` - Any authenticated user can read room data
2. **Room Write Access**: Complex condition allowing:
   - Room creation: Only if the creator sets themselves as `createdBy`
   - Room modification: Only by users marked as `isHost: true`
3. **Player Data**: Each player can only write to their own UID path
4. **Room Settings**: Only the room creator can modify settings
5. **Slug Management**: Only room hosts can create/modify slug mappings

### Integration with Application Code

The security rules work in conjunction with our existing room management utilities:
- `createRoom()` function ensures the creator is properly set as `createdBy`
- `joinRoom()` function allows players to add themselves to the players object
- Host management functions respect the `isHost` flag for authorization

### Host Privilege Escalation Fix

**Issue**: The original security rules allowed any authenticated user to modify their own `isHost` flag, creating a potential privilege escalation vulnerability.

**Solution**: Implemented additional security rules that:
1. **Prevent Self-Promotion**: Players cannot set their own `isHost` flag to `true`
2. **Restrict Host Flag Modification**: Only room creators can modify the `isHost` flag
3. **Allow Safe Operations**: Players can still set `isHost: false` when joining rooms

**Updated Rule Structure**:
```json
"players": {
  "$uid": {
    ".write": "auth.uid === $uid && (!newData.hasChild('isHost') || newData.child('isHost').val() === false)",
    "isHost": {
      ".write": "root.child('rooms/' + $roomId + '/createdBy').val() === auth.uid"
    }
  }
}
```

**Testing**: Comprehensive integration tests verify that:
- Non-host players cannot escalate their privileges
- Room creators can always modify host flags regardless of current host status
- Normal room operations (joining, leaving) continue to work
- Host privilege escalation attacks are prevented

## Benefits of RTDB Security Rules (Reinforcing ADR 002)

While implementing these security rules required careful consideration of RTDB's rule syntax and limitations, this reinforces the benefits of our RTDB choice:

* **Unified Security Model**: Security rules are part of the same Firebase project, eliminating the need for separate authentication/authorization services
* **Real-time Enforcement**: Security is enforced at the database level in real-time, providing immediate protection without additional API layers
* **Cost Efficiency**: Security rules enforce access at the database layer without adding extra application infrastructure
* **Development Simplicity**: Despite the learning curve, RTDB rules are simpler than implementing custom authorization middleware
* **Emulator Support**: Firebase emulators support security rules, enabling comprehensive local testing

## Alternatives Considered

* **Client-side Only Security**: Rejected due to security vulnerabilities - client-side validation can be bypassed
* **Custom API Middleware**: Would require additional server infrastructure, conflicting with our serverless architecture
* **Firestore Security Rules**: While more powerful, would require migrating our real-time game state to Firestore, losing the benefits documented in ADR 002
* **Third-party Authorization Service**: Would add complexity and cost without providing significant benefits over Firebase's built-in security

## Testing Strategy

* **Emulator Testing**: All security rules are tested using Firebase emulators in our integration test suite
* **Rule Validation**: Automated tests verify that authorized operations succeed and unauthorized operations fail
* **Edge Case Coverage**: Tests cover scenarios like host privilege changes, concurrent modifications, and malformed data
* **E2E Security**: End-to-end tests verify that the complete user flow respects security boundaries
* **Security Vulnerability Testing**: Comprehensive tests specifically verify protection against privilege escalation attacks and unauthorized access attempts

## Future Considerations

* **Enhanced Validation**: Consider adding more sophisticated data validation as the game features expand
* **Audit Logging**: Implement logging for security rule violations to monitor for potential attacks
* **Rate Limiting**: Consider implementing rate limiting for high-frequency operations to prevent abuse
* **Host Transfer**: Implement secure host transfer mechanisms if needed for game continuity
