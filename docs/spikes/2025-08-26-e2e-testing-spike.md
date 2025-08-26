# E2E Testing Spike: Critical User Flows

## Spike Objective
Evaluate and implement end-to-end testing for critical user flows in Word Chaser, focusing on multiplayer room management scenarios.

## Tool Selection: Playwright vs Cypress

### Why Playwright (Recommended)
- **Robust auto-waiting**: Built-in actionability checks (attached, visible, stable, enabled, non-obscured)
- **Multi-browser-context support**: Essential for testing multiplayer flows with multiple users
- **Out-of-process runner**: Deterministic scheduler reduces timing race conditions
- **Built-in traces/videos**: Faster debugging of intermittent failures
- **Isolated contexts per test**: Clean state by default

### Cypress Flakiness Issues (Common in Practice)
- **In-browser command queue**: Actions happen inside AUT event loop with subtle timing couplings
- **Retries only for assertions**: Actions (click/type) aren't retried, leading to "element detached" errors
- **Implicit subject chaining**: Hidden order/race assumptions across chained commands
- **Network intercept drift**: Route matching can become flaky with multiple requests

### Flakiness Root Causes
- **Async race conditions**: UI renders, network, timers, animations don't align consistently
- **Unstable selectors**: Text/layout shifts, dynamic IDs, CSS-only hooks
- **Shared state**: Leftover sessions/data between tests
- **Over-broad waits**: Arbitrary timeouts or "network idle" as readiness proxy

## Environment Architecture

### Firebase Emulator Integration
- Use Firebase Emulator Suite for RTDB (already implemented)
- Add Auth emulator for anonymous sign-in (recommended)
- App toggle: `NEXT_PUBLIC_USE_EMULATORS=true` to point SDKs at emulators
- Reset DB per test via RTDB emulator REST API

### Required App Changes
```typescript
// src/lib/firebase/firebase.ts
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, '127.0.0.1', 9099);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}
```

## Test Scenarios (Lean, High Value)

### Core Flows
1. **Guest sign-in → Create room → Lobby visible → Toggle ready**
2. **Multiplayer join flow**: Second user joins existing room → Both visible → Host sees start disabled → All ready → Start enabled → Status changes to playing
3. **Host transfer**: Host leaves → Host transfer to next player
4. **Room cleanup**: Last player leaves → Room deleted
5. **Join guardrails**: Joining full room or playing room blocked with user-facing message

### Example Test Structure
```typescript
// tests/e2e/lobby.multiplayer.e2e.ts
import { test, expect } from '@playwright/test';

test('host creates room, second player joins, all-ready -> playing', async ({ browser }) => {
  // Host context
  const hostCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  
  // Second player context
  const p2Ctx = await browser.newContext();
  const p2 = await p2Ctx.newPage();
  
  // Reset DB (RTDB emulator REST)
  await host.request.put('http://127.0.0.1:9000/.json?ns=demo-word-chaser', { data: null });
  
  await host.goto('http://localhost:3000');
  await host.getByRole('button', { name: /play as guest/i }).click();
  await host.getByRole('button', { name: /create a new room/i }).click();
  await host.getByRole('button', { name: /^create room$/i }).click();
  
  const roomCode = await host.getByTestId('room-code').innerText();
  await expect(host.getByText(/players \(\d+\/\d+\)/i)).toBeVisible();
  
  await p2.goto('http://localhost:3000');
  await p2.getByRole('button', { name: /join existing room/i }).click();
  await p2.getByLabel(/room code/i).fill(roomCode);
  await p2.getByRole('button', { name: /^join room$/i }).click();
  
  await expect(host.getByText(/players \(2\/\d+\)/i)).toBeVisible();
  
  await host.getByRole('button', { name: /ready|not ready/i }).click();
  await p2.getByRole('button', { name: /ready|not ready/i }).click();
  
  const startBtn = host.getByRole('button', { name: /start game/i });
  await expect(startBtn).toBeEnabled();
  await startBtn.click();
  
  await expect(host.getByText(/status: playing/i)).toBeVisible();
});
```

## Anti-Flake Strategy

### Selector Best Practices
- Prefer `getByRole`, `getByLabel`, or stable `data-testid` over classes/DOM shape
- Enable strict mode; avoid ambiguous locators
- Add `data-testid="room-code"` where room code is displayed

### Wait Strategy
- No `sleep`/fixed waits
- Use `expect(locator).toBeVisible()` or wait on specific responses/events
- Avoid "network idle" as readiness signal unless truly meaningful

### State Management
- Fresh browser context per test; no shared storage
- Reset backend state per test (RTDB emulator reset)
- Keep tests short; one flow per spec

### App Stability
- Disable CSS animations/transitions in test build if possible
- Provide deterministic "ready" markers (e.g., `data-testid="app-ready"`)
- Use consistent button labels: "Play as Guest", "Create a New Room", "Create Room", etc.

## Implementation Plan

### Phase 1: Setup (0.5-1 day)
- Install Playwright: `npm install -D @playwright/test`
- Add scripts: `"e2e": "playwright test"`, `"e2e:headed": "playwright test --headed"`
- Create `playwright.config.ts` with baseURL, retries (1-2), traces on failure
- Add emulator toggle in Firebase config
- Add `.env.e2e` with emulator settings

### Phase 2: First Tests (0.5-1 day)
- Create room + join + start flow (2 users)
- Host transfer flow
- Room cleanup flow
- Add minimal UI hooks (`data-testid` where needed)

### Phase 3: CI Integration (1-2 hours)
- Start emulators in job step
- Upload Playwright traces on failure
- Use service account ADC (not deprecated token)

### Required Environment Variables
```bash
# .env.e2e
NEXT_PUBLIC_USE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## CI Job Structure
```yaml
# Example GitHub Actions
- name: Start Firebase Emulators
  run: |
    firebase emulators:exec --only "database,auth" "pnpm exec playwright test"
  env:
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}

- name: Upload Playwright traces
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-traces
    path: test-results/
```

## Risks and Mitigation

### Risks
- **Auth emulator complexity**: If not used, anonymous auth hits production
- **Real-time timing**: Relies on auto-waits and UI cues
- **Test maintenance**: E2E tests require UI stability

### Mitigation
- Add Auth emulator wiring when `NEXT_PUBLIC_USE_EMULATORS=true`
- Keep flows small and focused
- Use stable selectors and explicit waits
- Maintain lean suite (5-8 core tests)

## Success Criteria
- [ ] Playwright installed and configured
- [ ] Emulator integration working
- [ ] First multiplayer flow test passing
- [ ] CI job with traces on failure
- [ ] Anti-flake practices documented

## Next Steps
1. Approve Playwright + emulator wiring approach
2. Implement Phase 1 setup
3. Add first test (create + join + start)
4. Expand incrementally based on confidence

## References
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [E2E Testing Anti-Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---
*Spike completed: 2025-08-26*
*Decision: Proceed with Playwright + Firebase Emulator Suite for E2E testing*
