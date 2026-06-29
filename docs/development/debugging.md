# Debugging

This page collects practical commands for inspecting local Firebase data and debugging E2E tests.

## Query Emulator Data

Dump the full Realtime Database emulator:

```bash
curl -s "http://127.0.0.1:9000/.json?ns=demo-word-chaser" | jq .
```

Inspect rooms:

```bash
curl -s "http://127.0.0.1:9000/rooms.json?ns=demo-word-chaser" | jq .
```

Inspect slug mappings:

```bash
curl -s "http://127.0.0.1:9000/slugs.json?ns=demo-word-chaser" | jq .
```

Clear all emulator data:

```bash
curl -X PUT -H 'Content-Type: application/json' \
  -d 'null' "http://127.0.0.1:9000/.json?ns=demo-word-chaser"
```

Query with the Firebase CLI:

```bash
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
npx firebase database:get / --project demo-word-chaser | jq .
```

## Debug E2E Tests

Start Firebase emulators first:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

Run E2E tests normally:

```bash
npm run e2e
```

Run with a visible browser:

```bash
npm run e2e:headed
```

Use Playwright UI mode:

```bash
npm run e2e:ui
```

Useful paths after E2E runs:

- `playwright-report/` - HTML report
- `test-results/` - Traces, screenshots, and videos

## E2E Test Files

Current E2E specs live in `tests/e2e/`:

- `game-round-logic.spec.ts`
- `room-management.spec.ts`
- `word-selection-submission.spec.ts`

Playwright starts app servers on ports `3000` and `3001` using `playwright.config.ts`.

## Integration Test Notes

The RTDB integration test file is `src/lib/firebase/__tests__/rtdb.integration.test.ts`.

It validates Firebase rules and backend room behavior against the emulator. It exits early when the emulator is unavailable, so `npm test` can still run without local Firebase.
