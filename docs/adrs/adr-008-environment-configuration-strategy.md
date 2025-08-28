# ADR-008: Environment Configuration Strategy

## Status

Accepted

## Context

The Word Chaser application needs to support both Firebase production and emulator environments for development and testing. We need a clear strategy for:

1. **Local Development**: Developers should be able to work safely without affecting production data
2. **E2E Testing**: Automated tests should run against consistent, isolated environments
3. **Production Testing**: Ability to test against real Firebase services when needed
4. **Environment Switching**: Clear process for switching between environments without conflicts

## Decision

We will implement a multi-environment configuration strategy with the following components:

### Environment Files

- **`.env.local`**: Manual development environment (used by `npm run dev`)
- **`.env.e2e.local`**: E2E testing environment (used by Playwright tests)
- **`src/lib/firebase/config/emulator.json`**: Firebase CLI configuration for emulator settings

### Default Behavior

- **Non-production environments**: Default to Firebase emulators
- **Production environment**: Use real Firebase services
- **E2E tests**: Always use emulators for consistency and isolation

### Environment Variables

| Variable | Purpose | Emulator Value | Production Value |
|----------|---------|----------------|------------------|
| `NEXT_PUBLIC_USE_EMULATORS` | Enable/disable emulators | `true` | `false` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `demo-word-chaser` | `word-chaser` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Database URL | `http://127.0.0.1:9000?ns=demo-word-chaser` | Production URL |
| `FIREBASE_AUTH_EMULATOR_HOST` | Auth emulator host | `127.0.0.1:9099` | Not used |
| `RTD_EMULATOR_HOST` | RTDB emulator host | `127.0.0.1` | Not used |
| `RTD_EMULATOR_PORT` | RTDB emulator port | `9000` | Not used |

### Configuration Strategy

```typescript
// src/lib/firebase/firebase.ts
const shouldUseEmulators = (() => {
  const explicit = process.env.NEXT_PUBLIC_USE_EMULATORS;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV !== 'production';
})();
```

## Consequences

### Positive

1. **Safety**: Default emulator usage prevents accidental production writes
2. **Isolation**: E2E tests run in isolated environments
3. **Flexibility**: Easy switching between environments for testing
4. **Consistency**: Clear configuration patterns across environments
5. **Developer Experience**: Clear documentation and troubleshooting guides

### Negative

1. **Complexity**: Multiple environment files to manage
2. **Configuration Overhead**: Developers must understand environment switching
3. **Token Conflicts**: Auth tokens from emulator are invalid for production
4. **Setup Requirements**: Emulator must be running for local development

### Mitigations

1. **Clear Documentation**: Comprehensive guides for environment switching
2. **Default Safety**: Emulators enabled by default in non-production
3. **Error Handling**: Graceful fallbacks and helpful error messages
4. **Automated Setup**: Pre-push hooks and CI/CD handle environment setup

## Implementation

### Environment Switching Process

**To Production Firebase:**
1. Update `.env.local` with production settings
2. Clear browser data (localStorage, cookies, cache)
3. Restart dev server

**To Emulator Development:**
1. Update `.env.local` with emulator settings
2. Start Firebase emulator
3. Restart dev server

### E2E Test Configuration

- Playwright forces emulator usage via `playwright.config.ts`
- Tests reset database before and after each test run
- Isolated browser contexts prevent test interference

### Pre-push Hooks

- Conditional integration tests when Firebase code changes
- Conditional E2E tests when UI components change
- Automatic emulator startup for test execution

## Related ADRs

- [ADR-007: Firebase Emulator Integration Tests](./adr-007-firebase-emulator-integration-tests.md)

## References

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)

