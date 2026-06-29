# ADR 007: Firebase Emulator Integration Tests

## Status

Accepted

## Context

We have strong unit tests and we plan to add end‑to‑end (E2E) tests for critical user flows. Some correctness concerns are best validated against a real backend surface without the full UI/browser stack:

- Security rules behavior (allow/deny)
- Data invariants and transitions (capacity limits, host transfer, all‑ready → playing)
- Slug uniqueness and mapping
- Real‑time subscription behavior as used by our app

E2E tests can verify user journeys but are slower, flakier, and less targeted for backend edge cases. Pure unit tests can miss integration issues with SDK semantics, rules, and subscription timing.

## Decision

Adopt a lean Firebase Realtime Database (RTDB) emulator integration test suite that:

- Runs separately from the default Jest suite so `npm test` remains fast and does not require local Firebase emulators.
- Fails loudly when explicitly invoked and the local RTDB emulator is unavailable.
- Validates our rules and invariants with deterministic backend‑level checks.
- Keeps scope tight to avoid “testing Firebase itself”; we test our contracts, not SDK internals.
- Leaves broader user journeys to E2E and logic branches to unit tests.

## Implementation Details

- Test file: `src/lib/firebase/__tests__/rtdb.integration.test.ts`
- Execution:
  - `npm test` excludes `*.integration.test.*` files.
  - `npm run test:integration` runs `*.integration.test.*` files.
  - If the emulator is unavailable during `npm run test:integration`, fail the run instead of silently skipping coverage.
- Emulator wiring:
  - Set `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_DATABASE_URL` to the emulator namespace.
  - Use `connectDatabaseEmulator(db, host, port)` to point the SDK at the emulator.
  - `jest.resetModules()` and `jest.unmock(...)` to bypass unit‑test mocks specifically for this file.
  - Load minimal RTDB rules via the emulator REST endpoint to validate allow/deny semantics.
- Covered scenarios (lean set):
  - Rules: writes denied outside allowed paths.
  - Joins capped at `maxPlayers`.
  - All players ready → `status: 'playing'` after `startGame`.
  - Host transfer when host leaves; delete room when last player leaves.
  - Slug uniqueness and `slugs/{slug} → roomId` mapping stored.
  - `subscribeToRoom` emits updates (sanity check only).
- Isolation: after each test, clear data with `set(ref(db), null)`.
- Local run:
  1. Start RTDB emulator, e.g. `firebase emulators:start --only database --project demo-word-chaser`
  2. Optionally export `RTD_EMULATOR_HOST`, `RTD_EMULATOR_PORT`, `RTD_EMULATOR_PROJECT`
  3. Run `npm run test:integration`

## Consequences

### Positive

- Faster, deterministic feedback on backend rules and invariants than E2E.
- Reduces E2E bloat and flake; shorter CI times.
- Higher confidence that our Firebase paths, rules, and subscriptions align with app assumptions.

### Negative

- Requires the local emulator to run these checks; adds a light setup step for devs/CI.
- Emulator parity is not perfect with production; some behaviors can differ.
- Tests may require updates alongside schema/rules changes.

### Neutral

- Complements (does not replace) unit and E2E tests.
- Scope is intentionally small to avoid retesting Firebase.

## Alternatives Considered

1. E2E‑only
   - Pros: High fidelity to user experience; no emulator.
   - Cons: Slower, more brittle; harder to target concurrency/rules edge cases.
   - Decision: Rejected as sole strategy; we keep E2E for critical flows and add lean integration tests.

2. Test against a staging Firebase project
   - Pros: Closer to prod; no emulator setup.
   - Cons: Cost, non‑deterministic data, rate limits; requires credentials.
   - Decision: Rejected for routine CI.

3. Broader emulator coverage (Auth, Functions, Storage)
   - Pros: Wider validation surface.
   - Cons: More setup/maintenance; outside current needs.
   - Decision: Defer; add incrementally if features require it.

## Related ADRs

- ADR 001: Serverless Stack Choice
- ADR 002: Firebase Realtime Database
- ADR 006: Session/Game Logic Separation

## Future Considerations

- Add CI workflow to spin up the RTDB emulator and run this suite.
- Expand to Auth/Functions emulator if features demand it (e.g., server‑side validation, scheduled tasks).
- Add additional rules tests if security rules grow more complex.
- Keep E2E focused on the smallest set of high‑value user journeys.

This balances speed and confidence: unit tests for logic, a lean emulator suite for backend correctness, and E2E for end‑user flows.
